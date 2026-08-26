/**
 * Blocking browser dialogs must never run for real under Karma - `alert`
 * halts the runner and `confirm` returns undefined, silently taking the
 * "cancel" path.
 *
 * Every `confirm()` call site in the app is a branch, so each one needs a
 * test with `true` AND one with `false`.
 *
 * Jasmine restores `window` property spies automatically after each spec.
 */
export interface DialogSpies {
  alert: jasmine.Spy<(message?: unknown) => void>;
  confirm: jasmine.Spy<(message?: string) => boolean>;
}

export function installDialogSpies(confirmResult = true): DialogSpies {
  return {
    alert: spyOn(window, 'alert'),
    confirm: spyOn(window, 'confirm').and.returnValue(confirmResult)
  };
}
