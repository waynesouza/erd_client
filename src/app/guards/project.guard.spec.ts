import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Params } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProjectGuard } from './project.guard';
import { ProjectService } from '../service/project.service';
import { StorageService } from '../service/storage.service';
import { createProjectServiceSpy, createStorageSpy } from '../../testing/service-doubles';
import { createRouterStub, provideRouterStub, RouterStub } from '../../testing/router.stub';
import { makeProject, makeUser } from '../../testing/fixtures';

/**
 * ProjectGuard is wired to no route in app-routing.module.ts, so it is never
 * exercised by the running app - but it is application logic and is measured,
 * so it is tested directly through canActivate.
 */
describe('ProjectGuard', () => {
  let guard: ProjectGuard;
  let projectSpy: jasmine.SpyObj<ProjectService>;
  let storageSpy: jasmine.SpyObj<StorageService>;
  let routerStub: RouterStub;

  beforeEach(() => {
    projectSpy = createProjectServiceSpy();
    storageSpy = createStorageSpy();
    routerStub = createRouterStub();
    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectService, useValue: projectSpy },
        { provide: StorageService, useValue: storageSpy },
        provideRouterStub(routerStub)
      ]
    });
    guard = TestBed.inject(ProjectGuard);
  });

  const routeWith = (params: Params): ActivatedRouteSnapshot =>
    ({ params }) as ActivatedRouteSnapshot;

  function resolve(route: ActivatedRouteSnapshot): boolean | undefined {
    let allowed: boolean | undefined;
    guard.canActivate(route).subscribe(v => (allowed = v));
    return allowed;
  }

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow a route that carries no project id', () => {
    expect(resolve(routeWith({}))).toBeTrue();
    expect(projectSpy.getProjectsByUserEmail).not.toHaveBeenCalled();
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to /login when the user has no email', () => {
    storageSpy.getUser.and.returnValue({});

    expect(resolve(routeWith({ projectId: 'project-1' }))).toBeFalse();
    expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('should redirect to /login when there is no user at all', () => {
    // Covers the left operand of `!user || !user.email`. The real
    // StorageService returns `{}`, so only a double can produce null here.
    storageSpy.getUser.and.returnValue(null);

    expect(resolve(routeWith({ projectId: 'project-1' }))).toBeFalse();
    expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/login']);
  });

  it('should allow a member of the project', () => {
    storageSpy.getUser.and.returnValue(makeUser());
    projectSpy.getProjectsByUserEmail.and.returnValue(of([makeProject({ id: 'project-1' })]));

    expect(resolve(routeWith({ projectId: 'project-1' }))).toBeTrue();
    expect(projectSpy.getProjectsByUserEmail).toHaveBeenCalledOnceWith('ada@erd.com');
    expect(routerStub.navigate).not.toHaveBeenCalled();
  });

  it('should accept the id route parameter as well as projectId', () => {
    // Covers the right operand of `params['projectId'] || params['id']`.
    storageSpy.getUser.and.returnValue(makeUser());
    projectSpy.getProjectsByUserEmail.and.returnValue(of([makeProject({ id: 'project-9' })]));

    expect(resolve(routeWith({ id: 'project-9' }))).toBeTrue();
  });

  it('should redirect a non-member to /diagram', () => {
    storageSpy.getUser.and.returnValue(makeUser());
    projectSpy.getProjectsByUserEmail.and.returnValue(of([makeProject({ id: 'other-project' })]));

    expect(resolve(routeWith({ projectId: 'project-1' }))).toBeFalse();
    expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/diagram']);
  });

  it('should redirect to /diagram when the lookup fails, swallowing the error', () => {
    storageSpy.getUser.and.returnValue(makeUser());
    projectSpy.getProjectsByUserEmail.and.returnValue(throwError(() => new Error('boom')));
    let errored = false;

    let allowed: boolean | undefined;
    guard.canActivate(routeWith({ projectId: 'project-1' }))
      .subscribe({ next: v => (allowed = v), error: () => (errored = true) });

    expect(allowed).toBeFalse();
    expect(errored).toBeFalse();
    expect(routerStub.navigate).toHaveBeenCalledOnceWith(['/diagram']);
  });
});
