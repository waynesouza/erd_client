import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { SideBarComponent } from './side-bar.component';
import { ProjectService } from '../../service/project.service';
import { StorageService } from '../../service/storage.service';
import { Project } from '../../model/project.model';
import {
  AuthServiceStub,
  createProjectServiceSpy,
  createStorageSpy,
  provideAuthStub,
  provideSharedStub,
  SharedServiceStub
} from '../../../testing/service-doubles';
import { createRouterStub, provideRouterStub, RouterStub } from '../../../testing/router.stub';
import { DialogSpies, installDialogSpies } from '../../../testing/dialogs';
import { makeProject, makeProjectUser, makeUser } from '../../../testing/fixtures';
import { ProjectModalStubComponent } from '../../../testing/stubs/project-modal.stub.component';

describe('SideBarComponent', () => {
  let fixture: ComponentFixture<SideBarComponent>;
  let component: SideBarComponent;
  let authStub: AuthServiceStub;
  let sharedStub: SharedServiceStub;
  let projectSpy: jasmine.SpyObj<ProjectService>;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let routerStub: RouterStub;
  let dialogs: DialogSpies;

  const OWNER_EMAIL = 'ada@erd.com';

  beforeEach(async () => {
    authStub = new AuthServiceStub();
    sharedStub = new SharedServiceStub();
    projectSpy = createProjectServiceSpy();
    storageSpy = createStorageSpy();
    routerStub = createRouterStub();

    await TestBed.configureTestingModule({
      declarations: [SideBarComponent, ProjectModalStubComponent],
      providers: [
        provideAuthStub(authStub),
        provideSharedStub(sharedStub),
        { provide: ProjectService, useValue: projectSpy },
        { provide: StorageService, useValue: storageSpy },
        provideRouterStub(routerStub)
      ]
    }).compileComponents();

    dialogs = installDialogSpies();
    spyOn(console, 'log');
    spyOn(console, 'error');
  });

  /**
   * The component reads storage in its CONSTRUCTOR, so the double is
   * configured before createComponent runs.
   */
  function build(user: unknown = makeUser({ email: OWNER_EMAIL })): void {
    storageSpy.getUser.and.returnValue(user);
    projectSpy.getProjectsByUserEmail.and.returnValue(of([]));
    fixture = TestBed.createComponent(SideBarComponent);
    component = fixture.componentInstance;
  }

  const ownedProject = (id = 'project-1'): Project =>
    makeProject({ id, usersDto: [makeProjectUser({ email: OWNER_EMAIL, role: 'OWNER' })] });

  const foreignProject = (id = 'project-2'): Project =>
    makeProject({ id, usersDto: [makeProjectUser({ email: 'grace@erd.com', role: 'OWNER' })] });

  const clickEvent = () =>
    jasmine.createSpyObj<MouseEvent>('MouseEvent', ['stopPropagation']);

  it('should create', () => {
    build();

    expect(component).toBeTruthy();
  });

  it('should adopt the stored user', () => {
    build();

    expect(component['user']).toEqual(makeUser({ email: OWNER_EMAIL }));
  });

  // -------------------------------------------------------------- projects

  describe('buildProjectList', () => {
    it('should load the projects of the current user on init', () => {
      build();
      const projects = [ownedProject()];
      projectSpy.getProjectsByUserEmail.and.returnValue(of(projects));

      component.ngOnInit();

      expect(projectSpy.getProjectsByUserEmail).toHaveBeenCalledWith(OWNER_EMAIL);
      expect(component.projects).toEqual(projects);
    });

    it('should fall back to an empty list when the response is empty', () => {
      // Covers the right operand of `response || []`.
      build();
      projectSpy.getProjectsByUserEmail.and.returnValue(of(null as unknown as Project[]));

      component.ngOnInit();

      expect(component.projects).toEqual([]);
    });

    it('should clear the list when the request fails', () => {
      build();
      component.projects = [ownedProject()];
      projectSpy.getProjectsByUserEmail.and.returnValue(
        throwError(() => ({ status: 500, message: 'boom' }))
      );

      component.ngOnInit();

      expect(component.projects).toEqual([]);
    });

    it('should do nothing when the stored user has no email', () => {
      // The real StorageService returns `{}` for an empty session, so this is
      // the default state before a login.
      build({});
      projectSpy.getProjectsByUserEmail.calls.reset();

      component.ngOnInit();

      expect(projectSpy.getProjectsByUserEmail).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no user at all', () => {
      build(null);
      projectSpy.getProjectsByUserEmail.calls.reset();

      component.ngOnInit();

      expect(projectSpy.getProjectsByUserEmail).not.toHaveBeenCalled();
    });
  });

  describe('loadProject', () => {
    it('should announce the selected project', () => {
      build();

      component.loadProject('project-1');

      expect(sharedStub.changeProjectId).toHaveBeenCalledOnceWith('project-1');
    });
  });

  describe('onProjectCreated', () => {
    it('should select the newly created project', () => {
      build();

      component.onProjectCreated('project-9');

      expect(sharedStub.changeProjectId).toHaveBeenCalledOnceWith('project-9');
    });
  });

  describe('setHoveredProject', () => {
    it('should track and clear the hovered project', () => {
      build();

      component.setHoveredProject('project-1');
      expect(component.hoveredProjectId).toBe('project-1');

      component.setHoveredProject(null);
      expect(component.hoveredProjectId).toBeNull();
    });
  });

  // -------------------------------------------------------------- modal

  describe('openCreateModal', () => {
    it('should open a blank modal in create mode', () => {
      build();
      component.selectedProject = ownedProject();

      component.openCreateModal();

      expect(component.isEditMode).toBeFalse();
      expect(component.selectedProject).toBeNull();
      expect(component.isModalOpen).toBeTrue();
    });
  });

  describe('openEditModal', () => {
    it('should load the project and open the modal in edit mode', async () => {
      build();
      const project = ownedProject();
      projectSpy.getProjectById.and.returnValue(of(project));
      const event = clickEvent();

      await component.openEditModal(project, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
      expect(component.selectedProject).toEqual(project);
      expect(component.isModalOpen).toBeTrue();
    });

    it('should leave the selection untouched when the lookup returns nothing', () => {
      build();
      projectSpy.getProjectById.and.returnValue(of(null as unknown as Project));

      return component.openEditModal(ownedProject(), clickEvent()).then(() => {
        expect(component.selectedProject).toBeNull();
        expect(component.isModalOpen).toBeTrue();
      });
    });

    it('should reject and leave the modal closed when the lookup fails', async () => {
      // getProjectDataById rejects and openEditModal does not catch, so the
      // rejection is consumed here to keep Karma from reporting it globally.
      build();
      projectSpy.getProjectById.and.returnValue(throwError(() => new Error('boom')));
      const event = clickEvent();

      await expectAsync(component.openEditModal(ownedProject(), event)).toBeRejected();

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(component.isEditMode).toBeTrue();
      expect(component.isModalOpen).toBeFalse();
    });
  });

  describe('closeModal', () => {
    it('should close and reload the project list', () => {
      build();
      component.isModalOpen = true;
      projectSpy.getProjectsByUserEmail.calls.reset();
      projectSpy.getProjectsByUserEmail.and.returnValue(of([ownedProject()]));

      component.closeModal();

      expect(component.isModalOpen).toBeFalse();
      expect(projectSpy.getProjectsByUserEmail).toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------- session

  describe('logout', () => {
    it('should clear the project and go to /login', () => {
      build();

      component.logout();

      expect(sharedStub.clearProjectId).toHaveBeenCalled();
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should still clear the session when the request fails', () => {
      build();
      authStub.logout.and.returnValue(throwError(() => new Error('offline')));

      component.logout();

      expect(authStub.setLoggedIn).toHaveBeenCalledOnceWith(false);
      expect(sharedStub.clearProjectId).toHaveBeenCalled();
      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
    });
  });

  describe('isLoginOrRegisterRoute', () => {
    ['/login', '/register'].forEach(url => {
      it(`should be true on ${url}`, () => {
        build();
        routerStub.url = url;

        expect(component.isLoginOrRegisterRoute()).toBeTrue();
      });
    });

    it('should be false on an application route', () => {
      build();
      routerStub.url = '/diagram';

      expect(component.isLoginOrRegisterRoute()).toBeFalse();
    });
  });

  describe('handleLogoutResponse', () => {
    it('should navigate on a successful response', () => {
      build();

      component.handleLogoutResponse({ success: true });

      expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
    });

    it('should do nothing on an unsuccessful response', () => {
      build();

      component.handleLogoutResponse({ success: false });

      expect(routerStub.navigate).not.toHaveBeenCalled();
    });
  });

  describe('handleUserResponse', () => {
    it('should accept a response without failing', () => {
      build();

      expect(() => component.handleUserResponse({ name: 'Ada', email: OWNER_EMAIL })).not.toThrow();
    });
  });

  // -------------------------------------------------------------- layout

  describe('toggleSidebar', () => {
    it('should flip the collapsed state and announce it', () => {
      build();
      const collapsed: boolean[] = [];
      component.sidebarCollapsed.subscribe(v => collapsed.push(v));

      component.toggleSidebar();
      component.toggleSidebar();

      expect(collapsed).toEqual([true, false]);
      expect(component.isCollapsed).toBeFalse();
    });
  });

  describe('ngOnDestroy', () => {
    it('should tear down the accumulated subscriptions', () => {
      build();
      const subscription = component['subscription'];
      const unsubscribe = spyOn(subscription, 'unsubscribe').and.callThrough();

      component.ngOnDestroy();

      expect(unsubscribe).toHaveBeenCalled();
      expect(subscription.closed).toBeTrue();
    });
  });

  // -------------------------------------------------------------- ownership

  describe('isOwnerOfSelectedProject', () => {
    it('should be true for the owner', () => {
      build();
      component.selectedProject = ownedProject();

      expect(component.isOwnerOfSelectedProject()).toBeTrue();
    });

    it('should be false for a non-owner', () => {
      build();
      component.selectedProject = foreignProject();

      expect(component.isOwnerOfSelectedProject()).toBeFalse();
    });

    it('should be false without a selection', () => {
      build();
      component.selectedProject = null;

      expect(component.isOwnerOfSelectedProject()).toBeFalse();
    });

    it('should be false without a user', () => {
      build(null);
      component.selectedProject = ownedProject();

      expect(component.isOwnerOfSelectedProject()).toBeFalse();
    });
  });

  describe('isOwnerOfProject', () => {
    it('should be true for the owner', () => {
      build();

      expect(component.isOwnerOfProject(ownedProject())).toBeTrue();
    });

    it('should be false for a non-owner', () => {
      build();

      expect(component.isOwnerOfProject(foreignProject())).toBeFalse();
    });

    it('should be false without a project', () => {
      build();

      expect(component.isOwnerOfProject(null as unknown as Project)).toBeFalse();
    });

    it('should be false without a user', () => {
      build(null);

      expect(component.isOwnerOfProject(ownedProject())).toBeFalse();
    });
  });

  // -------------------------------------------------------------- deletion

  describe('deleteSelectedProject', () => {
    it('should delete and refresh once confirmed', () => {
      build();
      component.selectedProject = ownedProject();
      projectSpy.deleteProject.and.returnValue(of(undefined));
      projectSpy.getProjectsByUserEmail.calls.reset();

      component.deleteSelectedProject();

      expect(projectSpy.deleteProject).toHaveBeenCalledOnceWith('project-1');
      expect(component.selectedProject).toBeNull();
      expect(projectSpy.getProjectsByUserEmail).toHaveBeenCalled();
    });

    it('should do nothing without a selection', () => {
      build();
      component.selectedProject = null;

      component.deleteSelectedProject();

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
      expect(dialogs.alert).not.toHaveBeenCalled();
    });

    it('should refuse a non-owner', () => {
      build();
      component.selectedProject = foreignProject();

      component.deleteSelectedProject();

      expect(dialogs.alert)
        .toHaveBeenCalledOnceWith('Only the project owner can delete this project.');
      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should do nothing when the user cancels', () => {
      dialogs.confirm.and.returnValue(false);
      build();
      component.selectedProject = ownedProject();

      component.deleteSelectedProject();

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should report a failed deletion', () => {
      build();
      component.selectedProject = ownedProject();
      projectSpy.deleteProject.and.returnValue(throwError(() => new Error('boom')));

      component.deleteSelectedProject();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to delete project. Please try again.');
      expect(component.selectedProject).not.toBeNull();
    });
  });

  describe('deleteProject', () => {
    it('should delete and refresh once confirmed', () => {
      build();
      const project = ownedProject();
      projectSpy.deleteProject.and.returnValue(of(undefined));
      projectSpy.getProjectsByUserEmail.calls.reset();
      const event = clickEvent();

      component.deleteProject(project, event);

      expect(event.stopPropagation).toHaveBeenCalled();
      expect(projectSpy.deleteProject).toHaveBeenCalledOnceWith('project-1');
      expect(projectSpy.getProjectsByUserEmail).toHaveBeenCalled();
    });

    it('should clear the selection when the deleted project was selected', () => {
      build();
      const project = ownedProject();
      component.selectedProject = project;
      projectSpy.deleteProject.and.returnValue(of(undefined));

      component.deleteProject(project, clickEvent());

      expect(component.selectedProject).toBeNull();
    });

    it('should keep a different selection intact', () => {
      build();
      const selected = ownedProject('project-7');
      component.selectedProject = selected;
      projectSpy.deleteProject.and.returnValue(of(undefined));

      component.deleteProject(ownedProject('project-1'), clickEvent());

      expect(component.selectedProject).toBe(selected);
    });

    it('should keep the selection when nothing is selected', () => {
      build();
      component.selectedProject = null;
      projectSpy.deleteProject.and.returnValue(of(undefined));

      component.deleteProject(ownedProject(), clickEvent());

      expect(component.selectedProject).toBeNull();
    });

    it('should refuse a non-owner', () => {
      build();

      component.deleteProject(foreignProject(), clickEvent());

      expect(dialogs.alert)
        .toHaveBeenCalledOnceWith('Only the project owner can delete this project.');
      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should do nothing when the user cancels', () => {
      dialogs.confirm.and.returnValue(false);
      build();

      component.deleteProject(ownedProject(), clickEvent());

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should report a failed deletion', () => {
      build();
      projectSpy.deleteProject.and.returnValue(throwError(() => new Error('boom')));

      component.deleteProject(ownedProject(), clickEvent());

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to delete project. Please try again.');
    });
  });
});
