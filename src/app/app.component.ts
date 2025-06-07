import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { StorageService } from './service/storage.service';
import { AuthService } from './service/auth.service';
import { EventBusService } from './shared/event-bus.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  isLoggedIn = false;
  eventBusSub?: Subscription;
  isSidebarCollapsed = false;

  constructor(private storageService: StorageService, private authService: AuthService,
              private eventBusService: EventBusService, private router: Router) { }

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.authService.loggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.eventBusSub = this.eventBusService.on('logout', () => {
      this.logout();
    });

    // Handle access denied events
    this.eventBusService.on('access-denied', () => {
      console.warn('Access denied to resource');
    });
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.storageService.clean();
        void this.router.navigate(['/login']);
      }, error: err => {
        console.log('Here: ', err);
      }
    });
  }

  isLoginOrRegister(): boolean {
    const currentRoute = this.router.url;
    return currentRoute.includes('/login') || currentRoute.includes('/register');
  }

  onSidebarCollapse(collapsed: boolean): void {
    this.isSidebarCollapsed = collapsed;
  }

}
