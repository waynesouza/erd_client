import { Injectable } from '@angular/core';

/**
 * Injectable access to the global `window`.
 *
 * Exists so that code calling `window.location.reload()` can be tested: a
 * direct call reloads the Karma runner and destroys the test run, and
 * `spyOn(window.location, 'reload')` throws in Chrome because `reload` is
 * neither writable nor configurable.
 *
 * Exposing the window itself - rather than wrapping `reload()` - keeps this
 * service fully coverable.
 */
@Injectable({
  providedIn: 'root'
})
export class WindowRefService {

  get nativeWindow(): Window {
    return window;
  }

}
