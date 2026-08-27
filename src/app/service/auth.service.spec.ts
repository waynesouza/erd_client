import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { createStorageSpy } from '../../testing/service-doubles';

const BASE_URL = 'http://localhost:8080/api';

/**
 * AuthService reads storage in its CONSTRUCTOR to seed loggedIn$. Because
 * `providedIn: 'root'` services are instantiated lazily on the first
 * TestBed.inject, the storage double is configured first and the service is
 * built on demand - never in a blanket beforeEach.
 */
describe('AuthService', () => {
  let httpMock: HttpTestingController;
  let storageSpy: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    storageSpy = createStorageSpy();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: StorageService, useValue: storageSpy }]
    });
    httpMock = TestBed.inject(HttpTestingController);

    // The service is chatty; keep the runner output readable.
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  afterEach(() => httpMock.verify());

  /** Builds the service AFTER the storage double has been configured. */
  function makeService(loggedIn: boolean): AuthService {
    storageSpy.isLoggedIn.and.returnValue(loggedIn);
    return TestBed.inject(AuthService);
  }

  function currentLoggedIn(service: AuthService): boolean | undefined {
    let value: boolean | undefined;
    service.loggedIn$.subscribe(v => (value = v));
    return value;
  }

  describe('construction', () => {
    it('should be created', () => {
      expect(makeService(false)).toBeTruthy();
    });

    it('should seed loggedIn$ as true when a session exists', () => {
      const service = makeService(true);

      expect(currentLoggedIn(service)).toBeTrue();
    });

    it('should seed loggedIn$ as false when no session exists', () => {
      const service = makeService(false);

      expect(currentLoggedIn(service)).toBeFalse();
    });
  });

  describe('isLoggedIn', () => {
    it('should delegate to the storage service', () => {
      const service = makeService(true);

      expect(service.isLoggedIn).toBeTrue();
      expect(storageSpy.isLoggedIn).toHaveBeenCalled();
    });
  });

  describe('setLoggedIn', () => {
    it('should push the new state to loggedIn$', () => {
      const service = makeService(false);

      service.setLoggedIn(true);

      expect(currentLoggedIn(service)).toBeTrue();
    });
  });

  describe('login', () => {
    it('should POST the credentials with credentials enabled', () => {
      const service = makeService(false);
      const credentials = { email: 'ada@erd.com', password: 'secret' };
      let received: unknown;

      service.login(credentials).subscribe(r => (received = r));

      const req = httpMock.expectOne(`${BASE_URL}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      expect(req.request.withCredentials).toBeTrue();
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush({ email: 'ada@erd.com' });

      expect(received).toEqual({ email: 'ada@erd.com' });
    });

    it('should mark the user as logged in on success', () => {
      const service = makeService(false);

      service.login({ email: 'ada@erd.com', password: 'secret' }).subscribe();
      httpMock.expectOne(`${BASE_URL}/auth/login`).flush({});

      expect(currentLoggedIn(service)).toBeTrue();
    });

    it('should mark the user as logged out and rethrow on failure', () => {
      const service = makeService(true);
      let status: number | undefined;

      service.login({ email: 'ada@erd.com', password: 'wrong' })
        .subscribe({ error: err => (status = err.status) });
      httpMock.expectOne(`${BASE_URL}/auth/login`)
        .flush(null, { status: 401, statusText: 'Unauthorized' });

      expect(status).toBe(401);
      expect(currentLoggedIn(service)).toBeFalse();
    });
  });

  describe('register', () => {
    it('should POST the registration to /user', () => {
      const service = makeService(false);
      const payload = {
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@erd.com',
        password: 'secret', role: 'USER'
      };
      let received: unknown;

      service.register(payload).subscribe(r => (received = r));

      const req = httpMock.expectOne(`${BASE_URL}/user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      expect(req.request.withCredentials).toBeTrue();
      req.flush({ id: 'user-1' });

      expect(received).toEqual({ id: 'user-1' });
    });

    it('should surface a failure without touching the login state', () => {
      // register has no pipe, so no tap/catchError arm runs.
      const service = makeService(true);
      let status: number | undefined;

      service.register({
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@erd.com',
        password: 'secret', role: 'USER'
      }).subscribe({ error: err => (status = err.status) });
      httpMock.expectOne(`${BASE_URL}/user`)
        .flush(null, { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
      expect(currentLoggedIn(service)).toBeTrue();
      expect(storageSpy.clean).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should clean storage and clear the login state on success', () => {
      const service = makeService(true);

      service.logout().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/auth/logout`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBeTrue();
      req.flush({});

      expect(storageSpy.clean).toHaveBeenCalled();
      expect(currentLoggedIn(service)).toBeFalse();
    });

    it('should still clean storage when the server rejects the logout', () => {
      const service = makeService(true);
      let status: number | undefined;

      service.logout().subscribe({ error: err => (status = err.status) });
      httpMock.expectOne(`${BASE_URL}/auth/logout`)
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
      expect(storageSpy.clean).toHaveBeenCalled();
      expect(currentLoggedIn(service)).toBeFalse();
    });
  });

  describe('refreshToken', () => {
    it('should keep the user logged in on success', () => {
      const service = makeService(false);
      let received: unknown;

      service.refreshToken().subscribe(r => (received = r));

      const req = httpMock.expectOne(`${BASE_URL}/auth/refresh-token`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      expect(req.request.withCredentials).toBeTrue();
      req.flush({ refreshed: true });

      expect(received).toEqual({ refreshed: true });
      expect(currentLoggedIn(service)).toBeTrue();
      expect(storageSpy.clean).not.toHaveBeenCalled();
    });

    [401, 403].forEach(status => {
      it(`should clean the session when the refresh fails with ${status}`, () => {
        const service = makeService(true);
        let seen: number | undefined;

        service.refreshToken().subscribe({ error: err => (seen = err.status) });
        httpMock.expectOne(`${BASE_URL}/auth/refresh-token`)
          .flush(null, { status, statusText: 'Denied' });

        expect(seen).toBe(status);
        expect(storageSpy.clean).toHaveBeenCalled();
        expect(currentLoggedIn(service)).toBeFalse();
      });
    });

    it('should keep the session on a non-auth failure', () => {
      // Covers the else path of `status === 401 || status === 403`.
      const service = makeService(true);
      let seen: number | undefined;

      service.refreshToken().subscribe({ error: err => (seen = err.status) });
      httpMock.expectOne(`${BASE_URL}/auth/refresh-token`)
        .flush(null, { status: 500, statusText: 'Server Error' });

      expect(seen).toBe(500);
      expect(storageSpy.clean).not.toHaveBeenCalled();
      expect(currentLoggedIn(service)).toBeTrue();
    });
  });
});
