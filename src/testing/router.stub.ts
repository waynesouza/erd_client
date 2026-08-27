import { Router } from '@angular/router';

/**
 * Router double whose `navigate` returns a real Promise.
 *
 * This is not optional: AuthGuard, ProjectGuard, LoginComponent and
 * JwtInterceptor all call `.then()` on the result of `navigate(...)`.
 * A bare `jasmine.createSpy()` returns `undefined` and those call sites
 * throw `TypeError: Cannot read properties of undefined (reading 'then')`.
 */
export interface RouterStub {
  navigate: jasmine.Spy<(commands: unknown[]) => Promise<boolean>>;
  url: string;
}

export function createRouterStub(url = '/diagram'): RouterStub {
  return {
    navigate: jasmine.createSpy('navigate').and.resolveTo(true),
    url
  };
}

export function provideRouterStub(stub: RouterStub) {
  return { provide: Router, useValue: stub };
}
