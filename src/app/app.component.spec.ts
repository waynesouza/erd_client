import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './service/auth.service';
import { StorageService } from './service/storage.service';
import { EventBusService } from './shared/event-bus.service';
import { EventData } from './shared/event.class';
import { AuthServiceStub, createStorageSpy, provideAuthStub } from '../testing/service-doubles';
import { SideBarStubComponent } from '../testing/stubs/side-bar.stub.component';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let authStub: AuthServiceStub;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let eventBus: EventBusService;
  let router: Router;
  let navigateSpy: jasmine.Spy;

  beforeEach(async () => {
    authStub = new AuthServiceStub();
    storageSpy = createStorageSpy();

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [AppComponent, SideBarStubComponent],
      providers: [
        provideAuthStub(authStub),
        { provide: StorageService, useValue: storageSpy }
      ]
    }).compileComponents();

    eventBus = TestBed.inject(EventBusService);
    router = TestBed.inject(Router);
    navigateSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it('should start logged out and expanded', () => {
    expect(component.isLoggedIn).toBeFalse();
    expect(component.isSidebarCollapsed).toBeFalse();
  });

  describe('ngOnInit', () => {
    it('should track the authentication state', () => {
      component.ngOnInit();

      authStub.loggedInSubject.next(true);
      expect(component.isLoggedIn).toBeTrue();

      authStub.loggedInSubject.next(false);
      expect(component.isLoggedIn).toBeFalse();
    });

    it('should log out when a logout event is announced', () => {
      component.ngOnInit();

      eventBus.emit(new EventData('logout', null));

      expect(authStub.logout).toHaveBeenCalled();
      expect(storageSpy.clean).toHaveBeenCalled();
    });

    it('should warn when an access-denied event is announced', () => {
      const warn = spyOn(console, 'warn');
      component.ngOnInit();

      eventBus.emit(new EventData('access-denied', null));

      expect(warn).toHaveBeenCalledOnceWith('Access denied to resource');
    });

    it('should keep a handle on the logout subscription', () => {
      component.ngOnInit();

      expect(component.eventBusSub).toBeDefined();
    });
  });

  describe('logout', () => {
    it('should clean the session and go to /login', () => {
      component.logout();

      expect(storageSpy.clean).toHaveBeenCalled();
      expect(navigateSpy).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should neither clean nor navigate when the logout request fails', () => {
      // The error arm only logs - a real behavioural gap, recorded not fixed.
      const log = spyOn(console, 'log');
      const failure = new Error('offline');
      authStub.logout.and.returnValue(throwError(() => failure));

      component.logout();

      expect(storageSpy.clean).not.toHaveBeenCalled();
      expect(navigateSpy).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledWith('Here: ', failure);
    });
  });

  describe('isLoginOrRegister', () => {
    ['/login', '/register'].forEach(url => {
      it(`should be true on ${url}`, () => {
        spyOnProperty(router, 'url', 'get').and.returnValue(url);

        expect(component.isLoginOrRegister()).toBeTrue();
      });
    });

    it('should be false on an application route', () => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/diagram');

      expect(component.isLoginOrRegister()).toBeFalse();
    });
  });

  describe('onSidebarCollapse', () => {
    it('should record the collapsed state', () => {
      component.onSidebarCollapse(true);
      expect(component.isSidebarCollapsed).toBeTrue();

      component.onSidebarCollapse(false);
      expect(component.isSidebarCollapsed).toBeFalse();
    });

    it('should react to the sidebar output through the template', () => {
      spyOnProperty(router, 'url', 'get').and.returnValue('/diagram');
      fixture.detectChanges();

      const sidebar = fixture.debugElement.query(By.directive(SideBarStubComponent));
      (sidebar.componentInstance as SideBarStubComponent).sidebarCollapsed.emit(true);

      expect(component.isSidebarCollapsed).toBeTrue();
    });
  });
});
