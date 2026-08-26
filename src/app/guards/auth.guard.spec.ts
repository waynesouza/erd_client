import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { StorageService } from '../service/storage.service';
import { createStorageSpy } from '../../testing/service-doubles';
import { createRouterStub, provideRouterStub, RouterStub } from '../../testing/router.stub';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let routerStub: RouterStub;

  beforeEach(() => {
    storageSpy = createStorageSpy();
    routerStub = createRouterStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: StorageService, useValue: storageSpy },
        provideRouterStub(routerStub)
      ]
    });
    guard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should let an authenticated user through', () => {
    storageSpy.isLoggedIn.and.returnValue(true);

    expect(guard.canActivate()).toBeTrue();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should redirect an anonymous user to /login', () => {
    storageSpy.isLoggedIn.and.returnValue(false);

    expect(guard.canActivate()).toBeFalse();
    expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
  });
});
