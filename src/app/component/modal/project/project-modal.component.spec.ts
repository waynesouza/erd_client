import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { ProjectModalComponent } from './project-modal.component';
import { DiagramService } from '../../../service/diagram.service';
import { ProjectService } from '../../../service/project.service';
import { StorageService } from '../../../service/storage.service';
import { Project, ProjectUser } from '../../../model/project.model';
import {
  createDiagramServiceSpy,
  createProjectServiceSpy,
  createStorageSpy,
  createWindowRefStub,
  provideWindowRefStub,
  WindowRefStub
} from '../../../../testing/service-doubles';
import { DialogSpies, installDialogSpies } from '../../../../testing/dialogs';
import { makeProject, makeProjectUser } from '../../../../testing/fixtures';

describe('ProjectModalComponent', () => {
  let fixture: ComponentFixture<ProjectModalComponent>;
  let component: ProjectModalComponent;
  let projectSpy: jasmine.SpyObj<ProjectService>;
  let diagramSpy: jasmine.SpyObj<DiagramService>;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let windowRef: WindowRefStub;
  let dialogs: DialogSpies;

  const OWNER = makeProjectUser({ id: 'user-1', email: 'ada@erd.com', role: 'OWNER' });
  const EDITOR = makeProjectUser({ id: 'user-2', email: 'grace@erd.com', role: 'EDITOR' });
  const VIEWER = makeProjectUser({ id: 'user-3', email: 'hedy@erd.com', role: 'VIEWER' });

  beforeEach(async () => {
    projectSpy = createProjectServiceSpy();
    diagramSpy = createDiagramServiceSpy();
    storageSpy = createStorageSpy();
    windowRef = createWindowRefStub();

    await TestBed.configureTestingModule({
      imports: [FormsModule],
      declarations: [ProjectModalComponent],
      providers: [
        { provide: ProjectService, useValue: projectSpy },
        { provide: DiagramService, useValue: diagramSpy },
        { provide: StorageService, useValue: storageSpy },
        provideWindowRefStub(windowRef)
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProjectModalComponent);
    component = fixture.componentInstance;
    dialogs = installDialogSpies();
    spyOn(console, 'error');
    spyOn(console, 'log');
  });

  /** Puts the component in edit mode as the OWNER of a three-member project. */
  function asOwnerEditing(members: ProjectUser[] = [OWNER, EDITOR, VIEWER]): void {
    storageSpy.getUser.and.returnValue(OWNER);
    component.isEditMode = true;
    component.projectToEdit = makeProject({ id: 'project-1', usersDto: [...members] });
    component.ngOnInit();
  }

  const overlayEvent = (onOverlay: boolean): MouseEvent => {
    const target = document.createElement('div');
    return { target, currentTarget: onOverlay ? target : document.createElement('div') } as unknown as MouseEvent;
  };

  const memberResponse = (member: ProjectUser) =>
    of(new HttpResponse({ status: 200, body: member }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // -------------------------------------------------------------- ngOnInit

  describe('ngOnInit', () => {
    it('should adopt the stored user', () => {
      storageSpy.getUser.and.returnValue(OWNER);

      component.ngOnInit();

      expect(component.currentUser).toEqual(OWNER);
    });

    it('should copy the project into the edit form in edit mode', () => {
      asOwnerEditing();

      expect(component.editProject).toEqual({
        id: 'project-1', name: 'Sales ERD', description: 'Sales domain model'
      });
    });

    it('should leave the edit form empty in create mode', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.isEditMode = false;

      component.ngOnInit();

      expect(component.editProject).toEqual({ id: '', name: '', description: '' });
    });

    it('should leave the edit form empty when there is no project to edit', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.isEditMode = true;
      component.projectToEdit = null;

      component.ngOnInit();

      expect(component.editProject.id).toBe('');
    });

    it('should close when no user can be resolved', () => {
      // Unreachable with the real StorageService, which returns `{}` - only a
      // double can produce null. Recorded rather than "fixed".
      storageSpy.getUser.and.returnValue(null);
      const closed = jasmine.createSpy('closed');
      component.modalClosed.subscribe(closed);

      component.ngOnInit();

      expect(closed).toHaveBeenCalledOnceWith(true);
      expect(component.currentUser).toBeNull();
    });
  });

  // -------------------------------------------------------------- form

  describe('currentProject', () => {
    it('should expose the edit form in edit mode', () => {
      asOwnerEditing();

      expect(component.currentProject).toBe(component.editProject);
    });

    it('should expose the create form in create mode', () => {
      expect(component.currentProject).toBe(component.newProject);
    });
  });

  describe('closeModal', () => {
    it('should reset both forms and announce the closure', () => {
      component.newMemberEmail = 'x@y.z';
      component.showAddMemberModal = true;
      component.showEditMemberModal = true;
      component.memberBeingEdited = EDITOR;
      const closed = jasmine.createSpy('closed');
      component.modalClosed.subscribe(closed);

      component.closeModal();

      expect(component.newProject).toEqual({ name: '', description: '', userEmail: '' });
      expect(component.editProject).toEqual({ id: '', name: '', description: '' });
      expect(component.showAddMemberModal).toBeFalse();
      expect(component.showEditMemberModal).toBeFalse();
      expect(component.newMemberEmail).toBe('');
      expect(component.memberBeingEdited).toBeNull();
      expect(closed).toHaveBeenCalledOnceWith(true);
    });
  });

  describe('submitForm', () => {
    it('should refuse a project with no name', () => {
      component.newProject = { name: '  ', description: 'd', userEmail: '' };

      component.submitForm();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Project name is required');
      expect(projectSpy.createProject).not.toHaveBeenCalled();
    });

    it('should refuse a project with no description', () => {
      component.newProject = { name: 'Sales', description: '  ', userEmail: '' };

      component.submitForm();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Project description is required');
      expect(projectSpy.createProject).not.toHaveBeenCalled();
    });

    it('should create a project, announce it, and seed its diagram', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.ngOnInit();
      component.newProject = { name: 'Sales', description: 'd', userEmail: '' };
      projectSpy.createProject.and.returnValue(of(makeProject({ id: 'project-9' })));
      diagramSpy.createDiagram.and.returnValue(of({ nodeDataArray: [], linkDataArray: [] }));
      const created = jasmine.createSpy('created');
      component.projectCreated.subscribe(created);

      component.submitForm();

      expect(projectSpy.createProject).toHaveBeenCalledOnceWith(
        jasmine.objectContaining({ name: 'Sales', userEmail: 'ada@erd.com' })
      );
      expect(created).toHaveBeenCalledOnceWith('project-9');
      expect(diagramSpy.createDiagram).toHaveBeenCalledOnceWith({ projectId: 'project-9' });
    });

    it('should report a creation response with no id', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.ngOnInit();
      component.newProject = { name: 'Sales', description: 'd', userEmail: '' };
      projectSpy.createProject.and.returnValue(of({} as unknown as Project));
      const created = jasmine.createSpy('created');
      component.projectCreated.subscribe(created);

      component.submitForm();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to create project. Please try again.');
      expect(created).not.toHaveBeenCalled();
      expect(diagramSpy.createDiagram).not.toHaveBeenCalled();
    });

    it('should report a failed creation', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.ngOnInit();
      component.newProject = { name: 'Sales', description: 'd', userEmail: '' };
      projectSpy.createProject.and.returnValue(throwError(() => new Error('boom')));

      component.submitForm();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to create project. Please try again.');
    });

    it('should swallow a diagram-creation failure', () => {
      storageSpy.getUser.and.returnValue(OWNER);
      component.ngOnInit();
      component.newProject = { name: 'Sales', description: 'd', userEmail: '' };
      projectSpy.createProject.and.returnValue(of(makeProject({ id: 'project-9' })));
      diagramSpy.createDiagram.and.returnValue(throwError(() => new Error('boom')));

      component.submitForm();

      expect(console.error).toHaveBeenCalledWith('Error creating diagram:', jasmine.any(Error));
      expect(dialogs.alert).not.toHaveBeenCalled();
    });

    it('should do nothing when there is no user to attribute the project to', () => {
      component.currentUser = null;
      component.newProject = { name: 'Sales', description: 'd', userEmail: '' };

      component.submitForm();

      expect(projectSpy.createProject).not.toHaveBeenCalled();
    });

    it('should update an existing project', () => {
      asOwnerEditing();
      projectSpy.updateProject.and.returnValue(of(makeProject()));
      const closed = jasmine.createSpy('closed');
      component.modalClosed.subscribe(closed);

      component.submitForm();

      // Asserted by value, not by reference: closeModal() replaces
      // editProject with a fresh blank object on success.
      expect(projectSpy.updateProject).toHaveBeenCalledOnceWith({
        id: 'project-1', name: 'Sales ERD', description: 'Sales domain model'
      });
      expect(closed).toHaveBeenCalled();
    });

    it('should report a failed update', () => {
      asOwnerEditing();
      projectSpy.updateProject.and.returnValue(throwError(() => new Error('boom')));

      component.submitForm();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to update project. Please try again.');
    });
  });

  // -------------------------------------------------------------- permissions

  describe('permissions', () => {
    it('should recognise the owner', () => {
      asOwnerEditing();

      expect(component.isOwner()).toBeTrue();
      expect(component.canManageMembers()).toBeTrue();
      expect(component.canManageProject()).toBeTrue();
    });

    it('should deny a viewer', () => {
      storageSpy.getUser.and.returnValue(VIEWER);
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER, VIEWER] });
      component.ngOnInit();

      expect(component.isOwner()).toBeFalse();
      expect(component.canManageProject()).toBeFalse();
    });

    it('should let an editor manage the project but not its members', () => {
      storageSpy.getUser.and.returnValue(EDITOR);
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
      component.ngOnInit();

      expect(component.canManageProject()).toBeTrue();
      expect(component.canManageMembers()).toBeFalse();
    });

    it('should deny everything without a user', () => {
      component.currentUser = null;
      component.projectToEdit = makeProject();

      expect(component.isOwner()).toBeFalse();
      expect(component.canManageProject()).toBeFalse();
    });

    it('should deny everything without a project', () => {
      component.currentUser = OWNER;
      component.projectToEdit = null;

      expect(component.isOwner()).toBeFalse();
      expect(component.canManageProject()).toBeFalse();
    });

    it('should deny a user who is not a member', () => {
      storageSpy.getUser.and.returnValue(makeProjectUser({ email: 'nobody@erd.com' }));
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER] });
      component.ngOnInit();

      expect(component.isOwner()).toBeFalse();
      expect(component.canManageProject()).toBeFalse();
    });

    describe('canChangeRole', () => {
      it('should allow the owner to change another member', () => {
        asOwnerEditing();

        expect(component.canChangeRole(EDITOR)).toBeTrue();
      });

      it('should refuse to change the owner own role', () => {
        asOwnerEditing();

        expect(component.canChangeRole(OWNER)).toBeFalse();
      });

      it('should refuse a non-owner', () => {
        storageSpy.getUser.and.returnValue(EDITOR);
        component.isEditMode = true;
        component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
        component.ngOnInit();

        expect(component.canChangeRole(VIEWER)).toBeFalse();
      });

      it('should refuse when the owner check passes but no user is set', () => {
        asOwnerEditing();
        spyOn(component, 'isOwner').and.returnValue(true);
        component.currentUser = null;

        expect(component.canChangeRole(EDITOR)).toBeFalse();
      });
    });

    describe('canRemoveMember', () => {
      it('should allow removing a non-owner member', () => {
        asOwnerEditing();

        expect(component.canRemoveMember(EDITOR)).toBeTrue();
      });

      it('should refuse removing oneself', () => {
        asOwnerEditing();

        expect(component.canRemoveMember(OWNER)).toBeFalse();
      });

      it('should refuse removing another owner', () => {
        const secondOwner = makeProjectUser({ id: 'user-4', email: 'zz@erd.com', role: 'OWNER' });
        asOwnerEditing([OWNER, secondOwner]);

        expect(component.canRemoveMember(secondOwner)).toBeFalse();
      });

      it('should refuse a non-owner', () => {
        storageSpy.getUser.and.returnValue(EDITOR);
        component.isEditMode = true;
        component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
        component.ngOnInit();

        expect(component.canRemoveMember(VIEWER)).toBeFalse();
      });

      it('should refuse when the owner check passes but no user is set', () => {
        asOwnerEditing();
        spyOn(component, 'isOwner').and.returnValue(true);
        component.currentUser = null;

        expect(component.canRemoveMember(EDITOR)).toBeFalse();
      });
    });
  });

  // -------------------------------------------------------------- members

  describe('removeMember', () => {
    it('should remove the member once confirmed', () => {
      asOwnerEditing();
      projectSpy.removeTeamMember.and.returnValue(of(undefined));

      component.removeMember('user-2');

      expect(projectSpy.removeTeamMember).toHaveBeenCalledOnceWith('user-2', 'project-1');
      expect(component.projectToEdit!.usersDto.map(m => m.id)).toEqual(['user-1', 'user-3']);
    });

    it('should keep the member when the user cancels', () => {
      dialogs.confirm.and.returnValue(false);
      asOwnerEditing();

      component.removeMember('user-2');

      expect(projectSpy.removeTeamMember).not.toHaveBeenCalled();
    });

    it('should report a failed removal', () => {
      asOwnerEditing();
      projectSpy.removeTeamMember.and.returnValue(throwError(() => new Error('boom')));

      component.removeMember('user-2');

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to remove member. Please try again.');
      expect(component.projectToEdit!.usersDto.length).toBe(3);
    });

    it('should do nothing for a non-owner', () => {
      storageSpy.getUser.and.returnValue(EDITOR);
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
      component.ngOnInit();

      component.removeMember('user-1');

      expect(projectSpy.removeTeamMember).not.toHaveBeenCalled();
    });

    it('should do nothing without a project', () => {
      component.currentUser = OWNER;
      component.projectToEdit = null;

      component.removeMember('user-2');

      expect(projectSpy.removeTeamMember).not.toHaveBeenCalled();
    });

    it('should do nothing for an unknown member', () => {
      asOwnerEditing();

      component.removeMember('user-404');

      expect(projectSpy.removeTeamMember).not.toHaveBeenCalled();
      expect(dialogs.alert).not.toHaveBeenCalled();
    });

    it('should refuse to remove a protected member', () => {
      asOwnerEditing();

      component.removeMember('user-1');   // the owner themself

      expect(dialogs.alert).toHaveBeenCalledOnceWith('You cannot remove this member.');
      expect(projectSpy.removeTeamMember).not.toHaveBeenCalled();
    });

    it('should tolerate the project vanishing before the response arrives', () => {
      asOwnerEditing();
      projectSpy.removeTeamMember.and.callFake(() => {
        component.projectToEdit = null;
        return of(undefined);
      });

      expect(() => component.removeMember('user-2')).not.toThrow();
    });
  });

  describe('add-member modal', () => {
    it('should open', () => {
      component.openAddMemberModal();

      expect(component.showAddMemberModal).toBeTrue();
    });

    it('should reset on cancel', () => {
      component.showAddMemberModal = true;
      component.newMemberEmail = 'x@y.z';
      component.newMemberRole = 'EDITOR';

      component.cancelAddMember();

      expect(component.showAddMemberModal).toBeFalse();
      expect(component.newMemberEmail).toBe('');
      expect(component.newMemberRole).toBe('VIEWER');
    });

    it('should close on an overlay click', () => {
      component.showAddMemberModal = true;

      component.closeAddMemberModal(overlayEvent(true));

      expect(component.showAddMemberModal).toBeFalse();
    });

    it('should stay open on an inner click', () => {
      component.showAddMemberModal = true;

      component.closeAddMemberModal(overlayEvent(false));

      expect(component.showAddMemberModal).toBeTrue();
    });
  });

  describe('addMember', () => {
    it('should add the member and reset the form', () => {
      asOwnerEditing([OWNER]);
      component.newMemberEmail = 'grace@erd.com';
      component.newMemberRole = 'EDITOR';
      projectSpy.addTeamMember.and.returnValue(memberResponse(EDITOR));

      component.addMember();

      expect(projectSpy.addTeamMember).toHaveBeenCalledOnceWith({
        projectId: 'project-1', userEmail: 'grace@erd.com', roleProjectEnum: 'EDITOR'
      });
      expect(component.projectToEdit!.usersDto.map(m => m.id)).toEqual(['user-1', 'user-2']);
      expect(component.showAddMemberModal).toBeFalse();
    });

    it('should close without adding when the response has no body', () => {
      asOwnerEditing([OWNER]);
      component.newMemberEmail = 'grace@erd.com';
      projectSpy.addTeamMember.and.returnValue(of(new HttpResponse({ status: 204, body: null })));

      component.addMember();

      expect(component.projectToEdit!.usersDto.length).toBe(1);
      expect(component.showAddMemberModal).toBeFalse();
    });

    it('should reject an empty email', () => {
      asOwnerEditing();
      component.newMemberEmail = '   ';

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
      expect(projectSpy.addTeamMember).not.toHaveBeenCalled();
    });

    it('should reject when there is no project', () => {
      component.projectToEdit = null;
      component.newMemberEmail = 'grace@erd.com';

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
    });

    it('should reject a malformed email', () => {
      asOwnerEditing();
      component.newMemberEmail = 'not-an-email';

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
      expect(projectSpy.addTeamMember).not.toHaveBeenCalled();
    });

    it('should reject an email padded with whitespace', () => {
      // Recorded quirk: the guard trims before testing for emptiness and the
      // payload trims too, but the regex runs against the RAW value - so a
      // padded address is refused rather than accepted and cleaned.
      asOwnerEditing([OWNER]);
      component.newMemberEmail = ' grace@erd.com ';

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
      expect(projectSpy.addTeamMember).not.toHaveBeenCalled();
    });

    it('should reject a member who is already on the project', () => {
      asOwnerEditing();
      component.newMemberEmail = 'GRACE@erd.com';

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('This user is already a member of the project.');
      expect(projectSpy.addTeamMember).not.toHaveBeenCalled();
    });

    it('should surface the server message on failure', () => {
      asOwnerEditing([OWNER]);
      component.newMemberEmail = 'grace@erd.com';
      projectSpy.addTeamMember.and.returnValue(throwError(() => ({ error: { message: 'Unknown user' } })));

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Unknown user');
    });

    it('should fall back to a generic message on failure', () => {
      asOwnerEditing([OWNER]);
      component.newMemberEmail = 'grace@erd.com';
      projectSpy.addTeamMember.and.returnValue(throwError(() => ({ error: null })));

      component.addMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith(
        'Failed to add member. Please check the email and try again.'
      );
    });
  });

  describe('edit-member modal', () => {
    it('should open populated from the member', () => {
      component.openEditMemberModal(EDITOR);

      expect(component.memberBeingEdited).toBe(EDITOR);
      expect(component.editMemberEmail).toBe('grace@erd.com');
      expect(component.editMemberRole).toBe('EDITOR');
      expect(component.showEditMemberModal).toBeTrue();
    });

    it('should reset on cancel', () => {
      component.openEditMemberModal(EDITOR);

      component.cancelEditMember();

      expect(component.showEditMemberModal).toBeFalse();
      expect(component.editMemberEmail).toBe('');
      expect(component.editMemberRole).toBe('VIEWER');
      expect(component.memberBeingEdited).toBeNull();
    });

    it('should close on an overlay click', () => {
      component.openEditMemberModal(EDITOR);

      component.closeEditMemberModal(overlayEvent(true));

      expect(component.showEditMemberModal).toBeFalse();
    });

    it('should stay open on an inner click', () => {
      component.openEditMemberModal(EDITOR);

      component.closeEditMemberModal(overlayEvent(false));

      expect(component.showEditMemberModal).toBeTrue();
    });
  });

  describe('updateMember', () => {
    it('should send the new role and refresh the member', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberRole = 'VIEWER';
      const updated = makeProjectUser({ id: 'user-2', email: 'grace@erd.com', role: 'VIEWER' });
      projectSpy.updateTeamMember.and.returnValue(memberResponse(updated));

      component.updateMember();

      expect(projectSpy.updateTeamMember).toHaveBeenCalledOnceWith({
        projectId: 'project-1', userId: 'user-2', role: 'VIEWER'
      });
      expect(component.projectToEdit!.usersDto[1].role).toBe('VIEWER');
      expect(component.showEditMemberModal).toBeFalse();
    });

    it('should just close when the role is unchanged', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);

      component.updateMember();

      expect(projectSpy.updateTeamMember).not.toHaveBeenCalled();
      expect(component.showEditMemberModal).toBeFalse();
    });

    it('should close without touching the list when the response has no body', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberRole = 'VIEWER';
      projectSpy.updateTeamMember.and.returnValue(of(new HttpResponse({ status: 204, body: null })));

      component.updateMember();

      expect(component.projectToEdit!.usersDto[1].role).toBe('EDITOR');
      expect(component.showEditMemberModal).toBeFalse();
    });

    it('should tolerate the member disappearing from the list', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberRole = 'VIEWER';
      projectSpy.updateTeamMember.and.callFake(() => {
        component.projectToEdit!.usersDto = [OWNER];
        return memberResponse(EDITOR);
      });

      component.updateMember();

      expect(component.projectToEdit!.usersDto).toEqual([OWNER]);
      expect(component.showEditMemberModal).toBeFalse();
    });

    it('should reject an empty email', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberEmail = '  ';

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
    });

    it('should reject when no member is being edited', () => {
      asOwnerEditing();
      component.editMemberEmail = 'grace@erd.com';
      component.memberBeingEdited = null;

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
    });

    it('should reject when there is no project', () => {
      component.openEditMemberModal(EDITOR);
      component.projectToEdit = null;

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
    });

    it('should reject a malformed email', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberEmail = 'not-an-email';

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Please enter a valid email address.');
    });

    it('should reject an email already used by another member', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberEmail = 'HEDY@erd.com';

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('This email is already in use by another member.');
      expect(projectSpy.updateTeamMember).not.toHaveBeenCalled();
    });

    it('should allow a new email that nobody else uses', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberEmail = 'fresh@erd.com';
      component.editMemberRole = 'VIEWER';
      projectSpy.updateTeamMember.and.returnValue(memberResponse(EDITOR));

      component.updateMember();

      expect(projectSpy.updateTeamMember).toHaveBeenCalled();
    });

    it('should surface the server message on failure', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberRole = 'VIEWER';
      projectSpy.updateTeamMember.and.returnValue(throwError(() => ({ error: { message: 'Denied' } })));

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Denied');
    });

    it('should fall back to a generic message on failure', () => {
      asOwnerEditing();
      component.openEditMemberModal(EDITOR);
      component.editMemberRole = 'VIEWER';
      projectSpy.updateTeamMember.and.returnValue(throwError(() => ({ error: null })));

      component.updateMember();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to update member. Please try again.');
    });
  });

  describe('updateMemberRole', () => {
    it('should send the new role and refresh the member', () => {
      asOwnerEditing();
      const updated = makeProjectUser({ id: 'user-2', email: 'grace@erd.com', role: 'VIEWER' });
      projectSpy.updateTeamMember.and.returnValue(memberResponse(updated));

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(projectSpy.updateTeamMember).toHaveBeenCalledOnceWith({
        projectId: 'project-1', userId: 'user-2', role: 'VIEWER'
      });
      expect(component.projectToEdit!.usersDto[1].role).toBe('VIEWER');
    });

    it('should do nothing when the response has no body', () => {
      asOwnerEditing();
      projectSpy.updateTeamMember.and.returnValue(of(new HttpResponse({ status: 204, body: null })));

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(component.projectToEdit!.usersDto[1].role).toBe('EDITOR');
    });

    it('should tolerate the member disappearing from the list', () => {
      asOwnerEditing();
      projectSpy.updateTeamMember.and.callFake(() => {
        component.projectToEdit!.usersDto = [OWNER];
        return memberResponse(EDITOR);
      });

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(component.projectToEdit!.usersDto).toEqual([OWNER]);
    });

    it('should refuse a non-owner', () => {
      storageSpy.getUser.and.returnValue(EDITOR);
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
      component.ngOnInit();

      component.updateMemberRole(OWNER, 'VIEWER');

      expect(projectSpy.updateTeamMember).not.toHaveBeenCalled();
    });

    it('should refuse without a project', () => {
      component.currentUser = OWNER;
      component.projectToEdit = null;

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(projectSpy.updateTeamMember).not.toHaveBeenCalled();
    });

    it('should refuse changing the current user own role', () => {
      asOwnerEditing();

      component.updateMemberRole(OWNER, 'VIEWER');

      expect(projectSpy.updateTeamMember).not.toHaveBeenCalled();
    });

    it('should alert and reload the page on failure', () => {
      // The reload only reaches a WindowRefService double - calling the real
      // window.location.reload() here would restart the Karma runner.
      asOwnerEditing();
      projectSpy.updateTeamMember.and.returnValue(throwError(() => ({ error: { message: 'Denied' } })));

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Denied');
      expect(windowRef.reloadSpy).toHaveBeenCalled();
    });

    it('should fall back to a generic message before reloading', () => {
      asOwnerEditing();
      projectSpy.updateTeamMember.and.returnValue(throwError(() => ({ error: null })));

      component.updateMemberRole(EDITOR, 'VIEWER');

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to update member role. Please try again.');
      expect(windowRef.reloadSpy).toHaveBeenCalled();
    });
  });

  describe('deleteProject', () => {
    it('should delete and close once confirmed', () => {
      asOwnerEditing();
      projectSpy.deleteProject.and.returnValue(of(undefined));
      const closed = jasmine.createSpy('closed');
      component.modalClosed.subscribe(closed);

      component.deleteProject();

      expect(projectSpy.deleteProject).toHaveBeenCalledOnceWith('project-1');
      expect(closed).toHaveBeenCalled();
    });

    it('should do nothing when the user cancels', () => {
      dialogs.confirm.and.returnValue(false);
      asOwnerEditing();

      component.deleteProject();

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should report a failed deletion', () => {
      asOwnerEditing();
      projectSpy.deleteProject.and.returnValue(throwError(() => new Error('boom')));

      component.deleteProject();

      expect(dialogs.alert).toHaveBeenCalledOnceWith('Failed to delete project. Please try again.');
    });

    it('should refuse a non-owner', () => {
      storageSpy.getUser.and.returnValue(EDITOR);
      component.isEditMode = true;
      component.projectToEdit = makeProject({ usersDto: [OWNER, EDITOR] });
      component.ngOnInit();

      component.deleteProject();

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });

    it('should refuse without a project', () => {
      component.currentUser = OWNER;
      component.projectToEdit = null;

      component.deleteProject();

      expect(projectSpy.deleteProject).not.toHaveBeenCalled();
    });
  });
});
