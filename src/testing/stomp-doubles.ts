import { Client } from '@stomp/stompjs';
import { StompClientFactory } from '../app/diagram/stomp-client.factory';

/**
 * Fake STOMP client. Records what the component publishes and exposes the
 * per-destination handlers so a test can push a server message into the
 * component without a broker.
 */
export class FakeStompClient {
  connected = false;
  activated = false;
  deactivated = false;

  onConnect: (frame: unknown) => void = () => undefined;
  onStompError: (frame: unknown) => void = () => undefined;

  readonly published: Array<{ destination: string; body: string }> = [];
  readonly handlers = new Map<string, (message: { body: string }) => void>();
  readonly unsubscribed: string[] = [];

  activate(): void {
    this.activated = true;
  }

  deactivate(): Promise<void> {
    this.deactivated = true;
    return Promise.resolve();
  }

  publish(frame: { destination: string; body: string }): void {
    this.published.push(frame);
  }

  subscribe(destination: string, callback: (message: { body: string }) => void) {
    this.handlers.set(destination, callback);
    return { unsubscribe: () => { this.unsubscribed.push(destination); } };
  }

  /** Delivers a message to whatever the component subscribed on `destination`. */
  deliver(destination: string, body: string): void {
    const handler = this.handlers.get(destination);
    if (!handler) {
      throw new Error(`Nothing is subscribed to ${destination}`);
    }
    handler({ body });
  }
}

export const asClient = (fake: FakeStompClient): Client => fake as unknown as Client;

export function createStompFactorySpy(
  client: FakeStompClient
): jasmine.SpyObj<StompClientFactory> {
  const spy = jasmine.createSpyObj<StompClientFactory>('StompClientFactory', ['create']);
  spy.create.and.returnValue(asClient(client));
  return spy;
}
