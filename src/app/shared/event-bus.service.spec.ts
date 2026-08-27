import { TestBed } from '@angular/core/testing';
import { EventBusService } from './event-bus.service';
import { EventData } from './event.class';

describe('EventBusService', () => {
  let service: EventBusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EventBusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should deliver the value of a matching event', () => {
    const action = jasmine.createSpy('action');
    service.on('logout', action);

    service.emit(new EventData('logout', 'payload'));

    expect(action).toHaveBeenCalledOnceWith('payload');
  });

  it('should not deliver an event with a different name', () => {
    // Drives the FALSE arm of the `filter` predicate, which is a branch.
    const action = jasmine.createSpy('action');
    service.on('logout', action);

    service.emit(new EventData('access-denied', null));

    expect(action).not.toHaveBeenCalled();
  });

  it('should deliver to several listeners independently', () => {
    const logoutAction = jasmine.createSpy('logout');
    const deniedAction = jasmine.createSpy('denied');
    service.on('logout', logoutAction);
    service.on('access-denied', deniedAction);

    service.emit(new EventData('access-denied', 403));

    expect(deniedAction).toHaveBeenCalledOnceWith(403);
    expect(logoutAction).not.toHaveBeenCalled();
  });

  it('should stop delivering after the subscription is torn down', () => {
    const action = jasmine.createSpy('action');
    const subscription = service.on('logout', action);

    subscription.unsubscribe();
    service.emit(new EventData('logout', 'payload'));

    expect(action).not.toHaveBeenCalled();
  });

  it('should not replay events emitted before subscribing', () => {
    // It is a plain Subject, not a BehaviorSubject - ordering matters.
    service.emit(new EventData('logout', 'missed'));
    const action = jasmine.createSpy('action');
    service.on('logout', action);

    expect(action).not.toHaveBeenCalled();
  });
});
