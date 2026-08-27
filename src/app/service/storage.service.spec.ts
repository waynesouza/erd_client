import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage.service';

const USER_KEY = 'auth-user';

/**
 * The only spec that touches real window.sessionStorage. Everywhere else uses
 * a StorageService double, so no other suite can be affected by what happens
 * here - but Karma runs every spec in one browser page with randomized order,
 * so the storage is cleared on both sides of each test regardless.
 */
describe('StorageService', () => {
  let service: StorageService;

  beforeEach(() => {
    window.sessionStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  afterEach(() => window.sessionStorage.clear());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('clean', () => {
    it('should wipe the whole session storage', () => {
      window.sessionStorage.setItem(USER_KEY, '{"email":"ada@erd.com"}');
      window.sessionStorage.setItem('unrelated', 'value');

      service.clean();

      expect(window.sessionStorage.length).toBe(0);
    });
  });

  describe('saveUser', () => {
    it('should remove the previous entry and store the serialized user', () => {
      const removeSpy = spyOn(window.sessionStorage, 'removeItem').and.callThrough();
      const setSpy = spyOn(window.sessionStorage, 'setItem').and.callThrough();
      const user = { email: 'ada@erd.com', fullName: 'Ada Lovelace' };

      service.saveUser(user);

      expect(removeSpy).toHaveBeenCalledWith(USER_KEY);
      expect(setSpy).toHaveBeenCalledWith(USER_KEY, JSON.stringify(user));
    });

    it('should overwrite an existing user', () => {
      service.saveUser({ email: 'first@erd.com' });
      service.saveUser({ email: 'second@erd.com' });

      expect(service.getUser()).toEqual({ email: 'second@erd.com' });
    });
  });

  describe('getUser', () => {
    it('should parse the stored user', () => {
      const user = { email: 'ada@erd.com', fullName: 'Ada Lovelace', token: 'abc' };
      window.sessionStorage.setItem(USER_KEY, JSON.stringify(user));

      expect(service.getUser()).toEqual(user);
    });

    it('should return an empty object - not null - when nothing is stored', () => {
      // This is load-bearing across the whole app: `{}` is TRUTHY, so guards
      // written as `if (!user)` never fire in production, while
      // `user?.email` is undefined. ProjectModalComponent.ngOnInit's
      // `if (!user)` branch is unreachable for exactly this reason.
      expect(service.getUser()).toEqual({});
    });

    it('should return an empty object when the stored value is an empty string', () => {
      window.sessionStorage.setItem(USER_KEY, '');

      expect(service.getUser()).toEqual({});
    });
  });

  describe('isLoggedIn', () => {
    it('should be true when the key is present', () => {
      window.sessionStorage.setItem(USER_KEY, JSON.stringify({ email: 'ada@erd.com' }));

      expect(service.isLoggedIn()).toBeTrue();
    });

    it('should be false when the key is absent', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should be true for an empty string, while getUser returns {}', () => {
      // An empty string is `!== null`, so the two methods disagree.
      window.sessionStorage.setItem(USER_KEY, '');

      expect(service.isLoggedIn()).toBeTrue();
      expect(service.getUser()).toEqual({});
    });
  });
});
