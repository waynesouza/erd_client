import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DiagramService } from './diagram.service';
import { DiagramModel } from '../model/diagram.model';
import { makeEntity } from '../../testing/fixtures';

// BASE_URL is captured at module load, so the dev environment value is fixed.
const BASE_URL = 'http://localhost:8080/api/diagram';

describe('DiagramService', () => {
  let service: DiagramService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(DiagramService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should POST a new diagram', () => {
    const diagram: DiagramModel = { nodeDataArray: [makeEntity()], linkDataArray: [] };
    let received: DiagramModel | undefined;

    service.createDiagram({ projectId: 'project-1' }).subscribe(r => (received = r));

    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ projectId: 'project-1' });
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush(diagram);

    expect(received).toEqual(diagram);
  });

  it('should GET the diagram of a project', () => {
    const diagram: DiagramModel = { nodeDataArray: [], linkDataArray: [] };
    let received: DiagramModel | undefined;

    service.getDiagram('project-1').subscribe(r => (received = r));

    const req = httpMock.expectOne(`${BASE_URL}/project-1`);
    expect(req.request.method).toBe('GET');
    req.flush(diagram);

    expect(received).toEqual(diagram);
  });

  it('should surface the error arm of getDiagram', () => {
    let status: number | undefined;

    service.getDiagram('project-1').subscribe({ error: err => (status = err.status) });

    httpMock.expectOne(`${BASE_URL}/project-1`)
      .flush(null, { status: 404, statusText: 'Not Found' });

    expect(status).toBe(404);
  });

  it('should surface the error arm of createDiagram', () => {
    let status: number | undefined;

    service.createDiagram({}).subscribe({ error: err => (status = err.status) });

    httpMock.expectOne(BASE_URL).flush(null, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });
});
