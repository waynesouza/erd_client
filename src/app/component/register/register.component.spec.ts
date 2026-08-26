import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthServiceStub, provideAuthStub } from '../../../testing/service-doubles';
import { createRouterStub, provideRouterStub, RouterStub } from '../../../testing/router.stub';

describe('RegisterComponent', () => {
  let fixture: ComponentFixture<RegisterComponent>;
  let component: RegisterComponent;
  let authStub: AuthServiceStub;
  let routerStub: RouterStub;

  beforeEach(async () => {
    authStub = new AuthServiceStub();
    routerStub = createRouterStub();

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [RegisterComponent],
      providers: [provideAuthStub(authStub), provideRouterStub(routerStub)]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the new account to the USER role', () => {
    expect(component.register).toEqual({
      firstName: '', lastName: '', email: '', password: '', role: 'USER'
    });
    expect(component.isLoading).toBeFalse();
    expect(component.isSuccessful).toBeFalse();
  });

  describe('onSubmit', () => {
    it('should announce success and redirect after three seconds', fakeAsync(() => {
      authStub.register.and.returnValue(of({ id: 'user-1' }));

      component.onSubmit();

      expect(component.isSuccessful).toBeTrue();
      expect(component.isSignUpFailed).toBeFalse();
      expect(component.isLoading).toBeFalse();
      expect(component.successMessage).toContain('Conta criada com sucesso!');
      expect(routerStub.navigate).not.toHaveBeenCalled();

      tick(3000);

      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
    }));

    it('should submit the form contents', () => {
      component.register = {
        firstName: 'Ada', lastName: 'Lovelace', email: 'ada@erd.com',
        password: 'secret', role: 'USER'
      };
      authStub.register.and.returnValue(of({}));

      component.onSubmit();

      expect(authStub.register).toHaveBeenCalledOnceWith(component.register);
    });

    it('should clear a previous failure while submitting', () => {
      component.isSignUpFailed = true;
      component.errorMessage = 'stale';
      authStub.register.and.returnValue(of({}));

      component.onSubmit();

      expect(component.isSignUpFailed).toBeFalse();
      expect(component.errorMessage).toBe('');
    });

    // Each case drives one leaf of `err.error?.message || err.error || default`.
    it('should prefer the structured server message', () => {
      authStub.register.and.returnValue(throwError(() => ({ error: { message: 'Email in use' } })));

      component.onSubmit();

      expect(component.errorMessage).toBe('Email in use');
      expect(component.isSignUpFailed).toBeTrue();
      expect(component.isLoading).toBeFalse();
    });

    it('should fall back to a plain string body', () => {
      authStub.register.and.returnValue(throwError(() => ({ error: 'Email in use' })));

      component.onSubmit();

      expect(component.errorMessage).toBe('Email in use');
    });

    it('should fall back to a generic message when the body is empty', () => {
      authStub.register.and.returnValue(throwError(() => ({ error: null })));

      component.onSubmit();

      expect(component.errorMessage).toBe('Erro ao criar conta. Tente novamente.');
    });
  });
});
