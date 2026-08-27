import { Injectable } from '@angular/core';
import { Client } from '@stomp/stompjs';
import * as SockJS from 'sockjs-client';

/**
 * STOMP/SockJS transport boundary. EXCLUDED from coverage (see
 * codeCoverageExclude in angular.json): `webSocketFactory` and `debug` are
 * callbacks that can only run by opening a real SockJS connection, which
 * means live network I/O inside the test runner - plus a 5s reconnect timer
 * and 4s heartbeats that never drain under fakeAsync.
 *
 * The client's own lifecycle (onConnect, onStompError, activate, deactivate,
 * subscribe, publish) stays in the component and is fully covered there
 * against a fake client.
 */
@Injectable({
  providedIn: 'root'
})
export class StompClientFactory {

  create(url: string): Client {
    return new Client({
      webSocketFactory: () => new SockJS(url),
      connectHeaders: {},
      debug: (str: string) => {
        console.log('STOMP Debug:', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
  }

}
