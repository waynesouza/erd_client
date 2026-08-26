import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../service/auth.service';
import { StorageService } from '../../service/storage.service';
import { AuthServiceStub, createStorageSpy, provideAuthStub } from '../../../testing/service-doubles';
import { createRouterStub, provideRouterStub, RouterStub } from '../../../testing/router.stub';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authStub: AuthServiceStub;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let routerStub: RouterStub;

  beforeEach(async () => {
    authStub = new AuthServiceStub();
    storageSpy = createStorageSpy();
    routerStub = createRouterStub();

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [LoginComponent],
      providers: [
        provideAuthStub(authStub),
        { provide: StorageService, useValue: storageSpy },
        provideRouterStub(routerStub)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with an empty form', () => {
    expect(component.login).toEqual({ email: '', password: '' });
    expect(component.isLoggedIn).toBeFalse();
    expect(component.isLoginFailed).toBeFalse();
    expect(component.errorMessage).toBe('');
  });

  describe('ngOnInit', () => {
    it('should send an already-authenticated user to /diagram', () => {
      storageSpy.isLoggedIn.and.returnValue(true);

      component.ngOnInit();

      expect(component.isLoggedIn).toBeTrue();
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/diagram']);
    });

    it('should stay on the page for an anonymous visitor', () => {
      storageSpy.isLoggedIn.and.returnValue(false);

      component.ngOnInit();

      expect(component.isLoggedIn).toBeFalse();
      expect(routerStub.navigate).not.toHaveBeenCalled();
    });
  });

  describe('onSubmit', () => {
    it('should store the user and go to /diagram on success', () => {
      const session = { token: 'abc', email: 'ada@erd.com', fullName: 'Ada Lovelace' };
      authStub.login.and.returnValue(of(session));
      component.login = { email: 'ada@erd.com', password: 'secret' };

      component.onSubmit();

      expect(authStub.login).toHaveBeenCalledOnceWith({ email: 'ada@erd.com', password: 'secret' });
      expect(storageSpy.saveUser).toHaveBeenCalledOnceWith(session);
      expect(component.isLoggedIn).toBeTrue();
      expect(component.isLoginFailed).toBeFalse();
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/diagram']);
    });

    // NOTE - recorded defect, deliberately not fixed: `err.error.message` is
    // unguarded, so a network-level failure (status 0, `error === null`)
    // throws a TypeError inside the error handler itself and the user is
    // shown nothing. It is not asserted here because RxJS 7 reports an error
    // raised inside an `error` callback asynchronously, via the global
    // unhandled-error hook, which fails the whole Karma run rather than the
    // single spec. The statement itself is already covered by the test below.
    it('should surface the server message on failure', () => {
      authStub.login.and.returnValue(throwError(() => ({ error: { message: 'Bad credentials' } })));

      component.onSubmit();

      expect(component.errorMessage).toBe('Bad credentials');
      expect(component.isLoginFailed).toBeTrue();
      expect(component.isLoggedIn).toBeFalse();
      expect(storageSpy.saveUser).not.toHaveBeenCalled();
    });
  });
});
