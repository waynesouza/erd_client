import { TestBed } from '@angular/core/testing';
import { SharedService } from './shared.service';

describe('SharedService', () => {
  let service: SharedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SharedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with a null project id', () => {
    let received: string | null | undefined;
    service.currentProjectId.subscribe(id => (received = id));

    expect(received).toBeNull();
  });

  it('should broadcast a new project id', () => {
    const received: (string | null)[] = [];
    service.currentProjectId.subscribe(id => received.push(id));

    service.changeProjectId('project-1');

    expect(received).toEqual([null, 'project-1']);
  });

  it('should broadcast null when the project id is cleared', () => {
    service.changeProjectId('project-1');
    const received: (string | null)[] = [];
    service.currentProjectId.subscribe(id => received.push(id));

    service.clearProjectId();

    expect(received).toEqual(['project-1', null]);
  });
});
