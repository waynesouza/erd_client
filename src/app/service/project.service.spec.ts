import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpResponse } from '@angular/common/http';
import { ProjectService } from './project.service';
import { Project } from '../model/project.model';
import { TeamMember } from '../model/team-member.model';
import { makeProject, makeTeamMember } from '../../testing/fixtures';

const BASE_URL = 'http://localhost:8080/api/project';

describe('ProjectService', () => {
  let service: ProjectService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProjectService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST a new project', () => {
    const project = makeProject();
    let received: Project | undefined;

    service.createProject({ name: 'Sales ERD', description: 'd', userEmail: 'ada@erd.com' })
      .subscribe(r => (received = r));

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush(project);

    expect(received).toEqual(project);
  });

  it('should GET the projects of a user', () => {
    let received: Project[] | undefined;

    service.getProjectsByUserEmail('ada@erd.com').subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/user-email/ada@erd.com`);
    expect(req.request.method).toBe('GET');
    req.flush([makeProject()]);

    expect(received?.length).toBe(1);
  });

  it('should PUT an updated project', () => {
    let received: Project | undefined;

    service.updateProject({ id: 'project-1', name: 'New', description: 'd' })
      .subscribe(r => (received = r));

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('PUT');
    req.flush(makeProject({ name: 'New' }));

    expect(received?.name).toBe('New');
  });

  it('should GET a project by id', () => {
    let received: Project | undefined;

    service.getProjectById('project-1').subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/project-1`);
    expect(req.request.method).toBe('GET');
    req.flush(makeProject());

    expect(received?.id).toBe('project-1');
  });

  it('should GET the members of a project', () => {
    let received: TeamMember[] | undefined;

    service.getProjectMembers('project-1').subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/project-1/members`);
    expect(req.request.method).toBe('GET');
    req.flush([makeTeamMember()]);

    expect(received?.length).toBe(1);
  });

  it('should POST a team member and emit the full response', () => {
    // observe: 'response' - subscribers get an HttpResponse, not the body.
    let received: HttpResponse<unknown> | undefined;

    service.addTeamMember({ projectId: 'project-1', userEmail: 'grace@erd.com', roleProjectEnum: 'EDITOR' })
      .subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/team-member`);
    expect(req.request.method).toBe('POST');
    req.flush({ id: 'user-2' });

    expect(received instanceof HttpResponse).toBeTrue();
    expect(received?.body).toEqual({ id: 'user-2' });
    expect(received?.status).toBe(200);
  });

  it('should PUT a team member and emit the full response', () => {
    let received: HttpResponse<unknown> | undefined;

    service.updateTeamMember({ userId: 'user-2', projectId: 'project-1', role: 'VIEWER' })
      .subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/team-member`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 'user-2' });

    expect(received instanceof HttpResponse).toBeTrue();
    expect(received?.body).toEqual({ id: 'user-2' });
  });

  it('should DELETE a team member', () => {
    let completed = false;

    service.removeTeamMember('user-2', 'project-1').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${BASE_URL}/team-member/user-2/project/project-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });

  it('should DELETE a project', () => {
    let completed = false;

    service.deleteProject('project-1').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${BASE_URL}/project-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });

  it('should surface a 403 on the error arm', () => {
    let status: number | undefined;

    service.getProjectsByUserEmail('ada@erd.com').subscribe({ error: err => (status = err.status) });

    httpMock.expectOne(`${BASE_URL}/user-email/ada@erd.com`)
      .flush(null, { status: 403, statusText: 'Forbidden' });

    expect(status).toBe(403);
  });
});
