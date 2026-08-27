// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting
} from '@angular/platform-browser-dynamic/testing';

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Safety net: sessionStorage is shared by every spec in the single Karma
// browser page, and Jasmine randomises spec order.
beforeEach(() => {
  window.sessionStorage.clear();
});

// Force EVERY application source file into the instrumented bundle.
//
// Without this, webpack only bundles - and Istanbul only instruments - files
// reachable from a spec. A source file that no spec imports is not reported
// as 0%; it is ABSENT from the report entirely, so the coverage gate would
// happily pass over completely untested code. Scoped to ./app so that
// src/main.ts is not pulled in and made to bootstrap the real application
// inside the test runner.
const sourceContext = require.context('./app', true, /^(?!.*\.spec\.ts$).*\.ts$/);
sourceContext.keys().forEach(sourceContext);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);
// And load the modules.
context.keys().forEach(context);
