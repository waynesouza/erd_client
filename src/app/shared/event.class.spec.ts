import { EventData } from './event.class';

// EventData is a real class, not an interface: it emits JavaScript and so it
// is measured by Istanbul.
describe('EventData', () => {
  it('should assign name and value', () => {
    const event = new EventData('logout', { reason: 'expired' });

    expect(event.name).toBe('logout');
    expect(event.value).toEqual({ reason: 'expired' });
  });

  it('should accept a null value', () => {
    const event = new EventData('access-denied', null);

    expect(event.name).toBe('access-denied');
    expect(event.value).toBeNull();
  });
});
