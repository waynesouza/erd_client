import { BehaviorSubject, Observable, of } from 'rxjs';
import { AuthService } from '../app/service/auth.service';
import { CollaborationService, EntityLock } from '../app/service/collaboration.service';
import { DdlService } from '../app/service/ddl.service';
import { DiagramService } from '../app/service/diagram.service';
import { ProjectService } from '../app/service/project.service';
import { SharedService } from '../app/service/shared.service';
import { StorageService } from '../app/service/storage.service';
import { WindowRefService } from '../app/service/window-ref.service';

/*
 * Two shapes are used deliberately:
 *
 * - `jasmine.createSpyObj<T>` for method-only services. The generic gives
 *   compile-time protection against method-name typos.
 * - hand-written stub classes for services that expose observable STATE,
 *   because createSpyObj's property bag installs getter spies that are
 *   awkward to re-target mid-spec. The stubs expose the backing Subject so
 *   a test can push values at will.
 *
 * NOTE: createSpyObj returns an object typed as the full service but
 * containing ONLY the listed methods. A call to an unlisted method fails at
 * runtime with no compile error - list every method the code under test can
 * reach.
 */

// ---------------------------------------------------------------- StorageService

export function createStorageSpy(): jasmine.SpyObj<StorageService> {
  const spy = jasmine.createSpyObj<StorageService>('StorageService', [
    'clean', 'saveUser', 'getUser', 'isLoggedIn'
  ]);
  // Mirrors the real service: an empty session yields `{}`, not null.
  spy.getUser.and.returnValue({});
  spy.isLoggedIn.and.returnValue(false);
  return spy;
}

// ---------------------------------------------------------------- AuthService

export class AuthServiceStub {
  readonly loggedInSubject = new BehaviorSubject<boolean>(false);
  readonly loggedIn$ = this.loggedInSubject.asObservable();
  isLoggedIn = false;
  setLoggedIn = jasmine.createSpy('setLoggedIn');
  login = jasmine.createSpy('login').and.returnValue(of({}));
  register = jasmine.createSpy('register').and.returnValue(of({}));
  logout = jasmine.createSpy('logout').and.returnValue(of({}));
  refreshToken = jasmine.createSpy('refreshToken').and.returnValue(of({}));
}

export function provideAuthStub(stub: AuthServiceStub) {
  return { provide: AuthService, useValue: stub };
}

// ---------------------------------------------------------------- SharedService

export class SharedServiceStub {
  readonly projectIdSubject = new BehaviorSubject<string | null>(null);
  readonly currentProjectId: Observable<string | null> = this.projectIdSubject.asObservable();
  changeProjectId = jasmine.createSpy('changeProjectId');
  clearProjectId = jasmine.createSpy('clearProjectId');
}

export function provideSharedStub(stub: SharedServiceStub) {
  return { provide: SharedService, useValue: stub };
}

// ---------------------------------------------------------------- CollaborationService

export class CollaborationServiceStub {
  readonly lockedEntitiesSubject = new BehaviorSubject<EntityLock[]>([]);
  readonly lockedEntities$ = this.lockedEntitiesSubject.asObservable();
  readonly activeUsersSubject = new BehaviorSubject<unknown[]>([]);
  readonly activeUsers$ = this.activeUsersSubject.asObservable();

  isEntityLockedByOtherUser = jasmine.createSpy('isEntityLockedByOtherUser').and.returnValue(false);
  isEntityLockedByCurrentUser = jasmine.createSpy('isEntityLockedByCurrentUser').and.returnValue(false);
  getEntityLock = jasmine.createSpy('getEntityLock').and.returnValue(undefined);
  lockEntity = jasmine.createSpy('lockEntity').and.returnValue(of({}));
  unlockEntity = jasmine.createSpy('unlockEntity').and.returnValue(of(undefined));
  getProjectLocks = jasmine.createSpy('getProjectLocks').and.returnValue(of([]));
  clearUserLocks = jasmine.createSpy('clearUserLocks').and.returnValue(of(undefined));
  forceCleanupStaleLocks = jasmine.createSpy('forceCleanupStaleLocks').and.returnValue(of(undefined));
  canEditDiagram = jasmine.createSpy('canEditDiagram').and.returnValue(true);
  getCurrentUserRole = jasmine.createSpy('getCurrentUserRole').and.returnValue('OWNER');
  processCollaborationMessage = jasmine.createSpy('processCollaborationMessage');
  clearProjectLocks = jasmine.createSpy('clearProjectLocks');
  checkEditConflict = jasmine.createSpy('checkEditConflict').and.returnValue({ canEdit: true });
}

export function provideCollaborationStub(stub: CollaborationServiceStub) {
  return { provide: CollaborationService, useValue: stub };
}

// ---------------------------------------------------------------- method-only services

export function createProjectServiceSpy(): jasmine.SpyObj<ProjectService> {
  return jasmine.createSpyObj<ProjectService>('ProjectService', [
    'createProject', 'getProjectsByUserEmail', 'updateProject', 'getProjectById',
    'getProjectMembers', 'addTeamMember', 'updateTeamMember', 'removeTeamMember', 'deleteProject'
  ]);
}

export function createDiagramServiceSpy(): jasmine.SpyObj<DiagramService> {
  return jasmine.createSpyObj<DiagramService>('DiagramService', ['createDiagram', 'getDiagram']);
}

export function createDdlServiceSpy(): jasmine.SpyObj<DdlService> {
  return jasmine.createSpyObj<DdlService>('DdlService', [
    'exportDdl', 'importDdl', 'downloadSqlFile', 'readSqlFile'
  ]);
}

// ---------------------------------------------------------------- WindowRefService

/** Window double exposing a spyable `location.reload` - see project-modal.component.ts. */
export interface WindowRefStub {
  nativeWindow: Window;
  reloadSpy: jasmine.Spy<() => void>;
}

export function createWindowRefStub(): WindowRefStub {
  const reloadSpy = jasmine.createSpy<() => void>('reload');
  return {
    nativeWindow: { location: { reload: reloadSpy } } as unknown as Window,
    reloadSpy
  };
}

export function provideWindowRefStub(stub: WindowRefStub) {
  return { provide: WindowRefService, useValue: { nativeWindow: stub.nativeWindow } };
}
