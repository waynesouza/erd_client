import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import {
  CollaborationMessage,
  CollaborationService,
  EntityLock
} from './collaboration.service';
import { StorageService } from './storage.service';
import { createStorageSpy } from '../../testing/service-doubles';
import { makeEntityLock, makeUser } from '../../testing/fixtures';

const BASE_URL = 'http://localhost:8080/api/collaboration';

/**
 * CollaborationService caches the user in its CONSTRUCTOR, so the storage
 * double is configured before the lazy TestBed.inject builds the service.
 * Three user shapes are needed: complete, no fullName, and absent.
 */
describe('CollaborationService', () => {
  let httpMock: HttpTestingController;
  let storageSpy: jasmine.SpyObj<StorageService>;

  const CURRENT = makeUser({ email: 'ada@erd.com', fullName: 'Ada Lovelace' });

  beforeEach(() => {
    storageSpy = createStorageSpy();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: StorageService, useValue: storageSpy }]
    });
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  function makeService(user: unknown = CURRENT): CollaborationService {
    storageSpy.getUser.and.returnValue(user);
    return TestBed.inject(CollaborationService);
  }

  /** Seeds the private lock subject without going through the network. */
  function seedLocks(service: CollaborationService, locks: EntityLock[]): void {
    (service as unknown as { lockedEntitiesSubject: { next(v: EntityLock[]): void } })
      .lockedEntitiesSubject.next(locks);
  }

  function currentLocks(service: CollaborationService): EntityLock[] {
    let locks: EntityLock[] = [];
    service.lockedEntities$.subscribe(l => (locks = l));
    return locks;
  }

  it('should be created', () => {
    expect(makeService()).toBeTruthy();
  });

  it('should start with no locks and no active users', () => {
    const service = makeService();
    let activeUsers: unknown[] = [];
    service.activeUsers$.subscribe(u => (activeUsers = u));

    expect(currentLocks(service)).toEqual([]);
    expect(activeUsers).toEqual([]);
  });

  // -------------------------------------------------------------- lock queries

  describe('isEntityLockedByOtherUser', () => {
    it('should be false when the entity is not locked', () => {
      const service = makeService();

      expect(service.isEntityLockedByOtherUser('entity-1')).toBeFalse();
    });

    it('should be true when another user holds the lock', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'grace@erd.com' })]);

      expect(service.isEntityLockedByOtherUser('entity-1')).toBeTrue();
    });

    it('should be false when the current user holds the lock', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'ada@erd.com' })]);

      expect(service.isEntityLockedByOtherUser('entity-1')).toBeFalse();
    });
  });

  describe('isEntityLockedByCurrentUser', () => {
    it('should be false when the entity is not locked', () => {
      const service = makeService();

      expect(service.isEntityLockedByCurrentUser('entity-1')).toBeFalse();
    });

    it('should be true when the current user holds the lock', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'ada@erd.com' })]);

      expect(service.isEntityLockedByCurrentUser('entity-1')).toBeTrue();
    });

    it('should be false when another user holds the lock', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'grace@erd.com' })]);

      expect(service.isEntityLockedByCurrentUser('entity-1')).toBeFalse();
    });
  });

  describe('getEntityLock', () => {
    it('should return the lock when present', () => {
      const service = makeService();
      const lock = makeEntityLock();
      seedLocks(service, [lock]);

      expect(service.getEntityLock('entity-1')).toBe(lock);
    });

    it('should return undefined when absent', () => {
      const service = makeService();

      expect(service.getEntityLock('entity-1')).toBeUndefined();
    });
  });

  // -------------------------------------------------------------- http

  describe('lockEntity', () => {
    it('should POST the lock request using the full name', () => {
      const service = makeService();

      service.lockEntity('entity-1', 'project-1').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/lock-entity`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        entityId: 'entity-1',
        projectId: 'project-1',
        userEmail: 'ada@erd.com',
        userName: 'Ada Lovelace'
      });
      req.flush(makeEntityLock());
    });

    it('should fall back to the email when the user has no full name', () => {
      // Covers the right operand of `fullName || email`.
      const service = makeService({ email: 'ada@erd.com', fullName: '', token: '' });

      service.lockEntity('entity-1', 'project-1').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/lock-entity`);
      expect(req.request.body.userName).toBe('ada@erd.com');
      req.flush(makeEntityLock());
    });

    it('should surface the error arm', () => {
      const service = makeService();
      let status: number | undefined;

      service.lockEntity('entity-1', 'project-1').subscribe({ error: e => (status = e.status) });
      httpMock.expectOne(`${BASE_URL}/lock-entity`)
        .flush(null, { status: 409, statusText: 'Conflict' });

      expect(status).toBe(409);
    });
  });

  describe('unlockEntity', () => {
    it('should POST the unlock request', () => {
      const service = makeService();

      service.unlockEntity('entity-1', 'project-1').subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/unlock-entity`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        entityId: 'entity-1',
        projectId: 'project-1',
        userEmail: 'ada@erd.com'
      });
      req.flush(null);
    });
  });

  describe('getProjectLocks', () => {
    it('should GET the locks of a project', () => {
      const service = makeService();
      let received: EntityLock[] | undefined;

      service.getProjectLocks('project-1').subscribe(r => (received = r));

      const req = httpMock.expectOne(`${BASE_URL}/project-locks/project-1`);
      expect(req.request.method).toBe('GET');
      req.flush([makeEntityLock()]);

      expect(received?.length).toBe(1);
    });
  });

  describe('clearUserLocks', () => {
    it('should DELETE the locks of the current user', () => {
      const service = makeService();

      service.clearUserLocks().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/user-locks/ada%40erd.com`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should URL-encode the email', () => {
      const service = makeService(makeUser({ email: 'a+b@erd.com' }));

      service.clearUserLocks().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/user-locks/a%2Bb%40erd.com`);
      req.flush(null);
    });

    it('should throw synchronously when there is no authenticated user', () => {
      // A synchronous throw, not an observable error - assert accordingly.
      const service = makeService({});

      expect(() => service.clearUserLocks()).toThrowError('User not authenticated');
    });
  });

  describe('forceCleanupStaleLocks', () => {
    it('should POST the cleanup request', () => {
      const service = makeService();

      service.forceCleanupStaleLocks().subscribe();

      const req = httpMock.expectOne(`${BASE_URL}/cleanup-stale-locks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({});
      req.flush(null);
    });
  });

  // -------------------------------------------------------------- roles

  describe('canEditDiagram', () => {
    it('should be false without an authenticated user', () => {
      const service = makeService({});

      expect(service.canEditDiagram([{ email: 'ada@erd.com', role: 'OWNER' }])).toBeFalse();
    });

    it('should allow an OWNER', () => {
      const service = makeService();

      expect(service.canEditDiagram([{ email: 'ada@erd.com', role: 'OWNER' }])).toBeTrue();
    });

    it('should allow an EDITOR', () => {
      const service = makeService();

      expect(service.canEditDiagram([{ email: 'ada@erd.com', role: 'EDITOR' }])).toBeTrue();
    });

    it('should refuse a VIEWER', () => {
      const service = makeService();

      expect(service.canEditDiagram([{ email: 'ada@erd.com', role: 'VIEWER' }])).toBeFalse();
    });

    it('should refuse a user who is not a project member', () => {
      const service = makeService();

      expect(service.canEditDiagram([{ email: 'grace@erd.com', role: 'OWNER' }])).toBeFalse();
    });
  });

  describe('getCurrentUserRole', () => {
    it('should be NONE without an authenticated user', () => {
      const service = makeService({});

      expect(service.getCurrentUserRole([{ email: 'ada@erd.com', role: 'OWNER' }])).toBe('NONE');
    });

    it('should return the role of the current user', () => {
      const service = makeService();

      expect(service.getCurrentUserRole([{ email: 'ada@erd.com', role: 'EDITOR' }])).toBe('EDITOR');
    });

    it('should be NONE when the user is not a member', () => {
      const service = makeService();

      expect(service.getCurrentUserRole([{ email: 'grace@erd.com', role: 'OWNER' }])).toBe('NONE');
    });

    it('should be NONE when the membership carries no role', () => {
      // Covers the right operand of `user?.role || 'NONE'`.
      const service = makeService();

      expect(service.getCurrentUserRole([{ email: 'ada@erd.com' }])).toBe('NONE');
    });
  });

  // -------------------------------------------------------------- messages

  describe('processCollaborationMessage', () => {
    const message = (overrides: Partial<CollaborationMessage>): CollaborationMessage => ({
      type: 'ENTITY_LOCKED',
      payload: {},
      projectId: 'project-1',
      userId: 'user-2',
      userEmail: 'grace@erd.com',
      ...overrides
    });

    it('should record a lock taken by another user', () => {
      const service = makeService();
      const lock = makeEntityLock({ userEmail: 'grace@erd.com' });

      service.processCollaborationMessage(message({ type: 'ENTITY_LOCKED', payload: lock }));

      expect(currentLocks(service)).toEqual([lock]);
    });

    it('should replace an existing lock on the same entity', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'grace@erd.com', userName: 'Old' })]);
      const fresh = makeEntityLock({ userEmail: 'grace@erd.com', userName: 'New' });

      service.processCollaborationMessage(message({ type: 'ENTITY_LOCKED', payload: fresh }));

      expect(currentLocks(service)).toEqual([fresh]);
    });

    it('should ignore a lock message about the current user', () => {
      const service = makeService();

      service.processCollaborationMessage(message({
        type: 'ENTITY_LOCKED',
        payload: makeEntityLock({ userEmail: 'ada@erd.com' })
      }));

      expect(currentLocks(service)).toEqual([]);
    });

    it('should remove a lock released by another user', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ entityId: 'entity-1', userEmail: 'grace@erd.com' })]);

      service.processCollaborationMessage(message({
        type: 'ENTITY_UNLOCKED',
        payload: { entityId: 'entity-1', userEmail: 'grace@erd.com' }
      }));

      expect(currentLocks(service)).toEqual([]);
    });

    it('should ignore an unlock message about the current user', () => {
      const service = makeService();
      const lock = makeEntityLock({ entityId: 'entity-1', userEmail: 'grace@erd.com' });
      seedLocks(service, [lock]);

      service.processCollaborationMessage(message({
        type: 'ENTITY_UNLOCKED',
        payload: { entityId: 'entity-1', userEmail: 'ada@erd.com' }
      }));

      expect(currentLocks(service)).toEqual([lock]);
    });

    it('should leave the locks untouched when a user joins', () => {
      const service = makeService();
      const lock = makeEntityLock();
      seedLocks(service, [lock]);

      service.processCollaborationMessage(message({
        type: 'USER_JOINED',
        payload: { userEmail: 'grace@erd.com' }
      }));

      expect(currentLocks(service)).toEqual([lock]);
    });

    it('should drop every lock held by a departing user', () => {
      const service = makeService();
      const staying = makeEntityLock({ entityId: 'entity-9', userEmail: 'hedy@erd.com' });
      seedLocks(service, [
        makeEntityLock({ entityId: 'entity-1', userEmail: 'grace@erd.com' }),
        makeEntityLock({ entityId: 'entity-2', userEmail: 'grace@erd.com' }),
        staying
      ]);

      service.processCollaborationMessage(message({
        type: 'USER_LEFT',
        payload: { userEmail: 'grace@erd.com' }
      }));

      expect(currentLocks(service)).toEqual([staying]);
    });

    it('should ignore an ENTITY_UPDATED message', () => {
      // Declared in the union type but has no `case` - it falls through.
      const service = makeService();
      const lock = makeEntityLock();
      seedLocks(service, [lock]);

      service.processCollaborationMessage(message({ type: 'ENTITY_UPDATED', payload: {} }));

      expect(currentLocks(service)).toEqual([lock]);
    });
  });

  describe('clearProjectLocks', () => {
    it('should drop every lock', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock()]);

      service.clearProjectLocks();

      expect(currentLocks(service)).toEqual([]);
    });
  });

  describe('checkEditConflict', () => {
    it('should allow editing an unlocked entity', () => {
      const service = makeService();

      expect(service.checkEditConflict('entity-1')).toEqual({ canEdit: true });
    });

    it('should allow editing an entity the current user already holds', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'ada@erd.com' })]);

      expect(service.checkEditConflict('entity-1')).toEqual({ canEdit: true });
    });

    it('should report the holder by name', () => {
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'grace@erd.com', userName: 'Grace Hopper' })]);

      expect(service.checkEditConflict('entity-1')).toEqual({
        canEdit: false,
        message: 'Entity is being edited by Grace Hopper'
      });
    });

    it('should fall back to the holder email when there is no name', () => {
      // Covers the right operand of `lock?.userName || lock?.userEmail`.
      const service = makeService();
      seedLocks(service, [makeEntityLock({ userEmail: 'grace@erd.com', userName: '' })]);

      expect(service.checkEditConflict('entity-1')).toEqual({
        canEdit: false,
        message: 'Entity is being edited by grace@erd.com'
      });
    });
  });
});
