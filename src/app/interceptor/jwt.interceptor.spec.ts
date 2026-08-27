import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpRequest,
  HttpResponse
} from '@angular/common/http';
import { Observable, Subject, of, throwError } from 'rxjs';
import { JwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../service/auth.service';
import { StorageService } from '../service/storage.service';
import { EventBusService } from '../shared/event-bus.service';
import { EventData } from '../shared/event.class';
import { AuthServiceStub, createStorageSpy } from '../../testing/service-doubles';
import { createRouterStub, RouterStub } from '../../testing/router.stub';

/**
 * The interceptor is instantiated directly rather than wired through
 * HTTP_INTERCEPTORS: `isRefreshing` is mutable instance state, and a
 * hand-rolled HttpHandler gives exact control over what `next.handle`
 * returns and how many times it is called - which is what the re-entrancy
 * and retry cases assert on.
 */
describe('JwtInterceptor', () => {
  let interceptor: JwtInterceptor;
  let authStub: AuthServiceStub;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let eventBusSpy: jasmine.SpyObj<EventBusService>;
  let routerStub: RouterStub;
  let handler: { handle: jasmine.Spy<(req: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>> };

  beforeEach(() => {
    authStub = new AuthServiceStub();
    storageSpy = createStorageSpy();
    eventBusSpy = jasmine.createSpyObj<EventBusService>('EventBusService', ['on', 'emit']);
    routerStub = createRouterStub();
    handler = { handle: jasmine.createSpy('handle') };

    interceptor = new JwtInterceptor(
      authStub as unknown as AuthService,
      storageSpy,
      eventBusSpy,
      routerStub as unknown as never
    );

    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  const request = (url = 'http://localhost:8080/api/project') =>
    new HttpRequest<unknown>('GET', url);

  const httpError = (status: number, url = 'http://localhost:8080/api/project') =>
    new HttpErrorResponse({ status, statusText: 'Error', url });

  /** Runs intercept and reports which arm fired. */
  function run(req: HttpRequest<unknown>): { value?: HttpEvent<unknown>; error?: unknown } {
    const outcome: { value?: HttpEvent<unknown>; error?: unknown } = {};
    interceptor.intercept(req, handler as unknown as HttpHandler)
      .subscribe({ next: v => (outcome.value = v), error: e => (outcome.error = e) });
    return outcome;
  }

  describe('request decoration', () => {
    it('should send every request with credentials', () => {
      handler.handle.and.returnValue(of(new HttpResponse({ status: 200 })));

      run(request());

      const forwarded = handler.handle.calls.mostRecent().args[0];
      expect(forwarded.withCredentials).toBeTrue();
    });

    it('should pass a successful response straight through', () => {
      const response = new HttpResponse({ status: 200, body: { ok: true } });
      handler.handle.and.returnValue(of(response));

      expect(run(request()).value).toBe(response);
    });
  });

  describe('non-HTTP errors', () => {
    it('should rethrow an error that is not an HttpErrorResponse', () => {
      const failure = new Error('network down');
      handler.handle.and.returnValue(throwError(() => failure));

      expect(run(request()).error).toBe(failure);
      expect(authStub.refreshToken).not.toHaveBeenCalled();
      expect(routerStub.navigate).not.toHaveBeenCalled();
    });
  });

  describe('401 on the auth endpoints', () => {
    it('should not attempt a refresh when the login itself fails', () => {
      const error = httpError(401, 'http://localhost:8080/api/auth/login');
      handler.handle.and.returnValue(throwError(() => error));

      expect(run(request('http://localhost:8080/api/auth/login')).error).toBe(error);
      expect(authStub.refreshToken).not.toHaveBeenCalled();
      expect(storageSpy.clean).not.toHaveBeenCalled();
    });

    it('should log the user out when the refresh endpoint returns 401', () => {
      const url = 'http://localhost:8080/api/auth/refresh-token';
      const error = httpError(401, url);
      handler.handle.and.returnValue(throwError(() => error));

      expect(run(request(url)).error).toBe(error);
      expect(authStub.refreshToken).not.toHaveBeenCalled();
      expect(storageSpy.clean).toHaveBeenCalled();
      expect(authStub.setLoggedIn).toHaveBeenCalledOnceWith(false);
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
      expect(eventBusSpy.emit).toHaveBeenCalledOnceWith(new EventData('logout', null));
    });
  });

  describe('401 elsewhere', () => {
    it('should refresh the token and retry the original request', () => {
      const retried = new HttpResponse({ status: 200, body: { ok: true } });
      handler.handle.and.returnValues(throwError(() => httpError(401)), of(retried));
      storageSpy.isLoggedIn.and.returnValue(true);
      authStub.refreshToken.and.returnValue(of({ refreshed: true }));

      expect(run(request()).value).toBe(retried);
      expect(authStub.refreshToken).toHaveBeenCalledTimes(1);
      expect(handler.handle).toHaveBeenCalledTimes(2);
    });

    [401, 403].forEach(status => {
      it(`should log the user out when the refresh fails with ${status}`, () => {
        handler.handle.and.returnValue(throwError(() => httpError(401)));
        storageSpy.isLoggedIn.and.returnValue(true);
        const refreshError = httpError(status);
        authStub.refreshToken.and.returnValue(throwError(() => refreshError));

        expect(run(request()).error).toBe(refreshError);
        expect(storageSpy.clean).toHaveBeenCalled();
        expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
        expect(eventBusSpy.emit).toHaveBeenCalledOnceWith(new EventData('logout', null));
      });
    });

    it('should keep the session when the refresh fails for another reason', () => {
      // Covers the else path of `status === 401 || status === 403`.
      handler.handle.and.returnValue(throwError(() => httpError(401)));
      storageSpy.isLoggedIn.and.returnValue(true);
      const refreshError = httpError(500);
      authStub.refreshToken.and.returnValue(throwError(() => refreshError));

      expect(run(request()).error).toBe(refreshError);
      expect(storageSpy.clean).not.toHaveBeenCalled();
      expect(routerStub.navigate).not.toHaveBeenCalled();
    });

    it('should redirect to /login when there is no session to refresh', () => {
      handler.handle.and.returnValue(throwError(() => httpError(401)));
      storageSpy.isLoggedIn.and.returnValue(false);

      const outcome = run(request());

      expect((outcome.error as Error).message).toBe('Unauthorized');
      expect(authStub.refreshToken).not.toHaveBeenCalled();
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
    });
  });

  describe('concurrent refreshes', () => {
    it('should refresh only once while a refresh is already in flight', () => {
      const pending = new Subject<unknown>();
      handler.handle.and.returnValue(throwError(() => httpError(401)));
      storageSpy.isLoggedIn.and.returnValue(true);
      authStub.refreshToken.and.returnValue(pending.asObservable());

      run(request());                     // starts the refresh
      const second = run(request());      // sees isRefreshing === true

      expect(authStub.refreshToken).toHaveBeenCalledTimes(1);
      expect((second.error as Error).message).toBe('Unauthorized');
      pending.complete();
    });

    it('should allow a new refresh after the previous one succeeded', () => {
      handler.handle.and.returnValues(
        throwError(() => httpError(401)), of(new HttpResponse({ status: 200 })),
        throwError(() => httpError(401)), of(new HttpResponse({ status: 200 }))
      );
      storageSpy.isLoggedIn.and.returnValue(true);
      authStub.refreshToken.and.returnValue(of({}));

      run(request());
      run(request());

      expect(authStub.refreshToken).toHaveBeenCalledTimes(2);
    });

    it('should allow a new refresh after the previous one failed', () => {
      handler.handle.and.returnValue(throwError(() => httpError(401)));
      storageSpy.isLoggedIn.and.returnValue(true);
      authStub.refreshToken.and.returnValue(throwError(() => httpError(500)));

      run(request());
      run(request());

      expect(authStub.refreshToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('403', () => {
    it('should redirect to /diagram, announce the denial, and still rethrow', () => {
      // There is no early return here - the original error falls through.
      const error = httpError(403);
      handler.handle.and.returnValue(throwError(() => error));

      expect(run(request()).error).toBe(error);
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/diagram']);
      expect(eventBusSpy.emit).toHaveBeenCalledOnceWith(new EventData('access-denied', null));
      expect(storageSpy.clean).not.toHaveBeenCalled();
    });
  });

  describe('other statuses', () => {
    it('should rethrow a 404 untouched', () => {
      const error = httpError(404);
      handler.handle.and.returnValue(throwError(() => error));

      expect(run(request()).error).toBe(error);
      expect(routerStub.navigate).not.toHaveBeenCalled();
      expect(eventBusSpy.emit).not.toHaveBeenCalled();
    });
  });
});
