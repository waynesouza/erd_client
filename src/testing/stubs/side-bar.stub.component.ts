import { Component, EventEmitter, Output } from '@angular/core';

/**
 * Real stub rather than NO_ERRORS_SCHEMA: with the schema, an unknown element's
 * `(sidebarCollapsed)` binding degrades into a plain DOM event listener that
 * never fires, so AppComponent.onSidebarCollapse would be unreachable through
 * the template. Templates are inline - JIT would try to fetch a templateUrl.
 */
@Component({
  selector: 'app-side-bar',
  template: ''
})
export class SideBarStubComponent {
  @Output() itemClicked = new EventEmitter<string>();
  @Output() sidebarCollapsed = new EventEmitter<boolean>();
}
