import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { StorageService } from '../service/storage.service';
import { EventBusService } from '../shared/event-bus.service';
import { EventData } from '../shared/event.class';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService, private storageService: StorageService,
              private eventBusService: EventBusService, private router: Router) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('JWT Interceptor - Request URL:', request.url);
    console.log('JWT Interceptor - Headers before:', request.headers.keys());

    // Clone request with credentials for cookie-based auth
    request = request.clone({
      withCredentials: true
    });

    console.log('JWT Interceptor - withCredentials set to:', request.withCredentials);

    return next.handle(request)
      .pipe(catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401 && !request.url.includes('/auth/login')) {
            return this.handleUnauthorized(request, next);
          }
          if (error.status === 403) {
            // Access denied - redirect to main page
            this.router.navigate(['/diagram']).then();
            this.eventBusService.emit(new EventData('access-denied', null));
          }
        }

        return throwError(() => error);
      }));
  }

  private handleUnauthorized(request: HttpRequest<any>, next: HttpHandler) {
    console.log(1);
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      if (this.storageService.isLoggedIn()) {
        return this.authService.refreshToken()
          .pipe(switchMap(() => {
            this.isRefreshing = false;
            // Retry the original request after refreshing token
            return next.handle(request);
          }), catchError((error) => {
            this.isRefreshing = false;
            console.error('Token refresh failed:', error);

            // If refresh fails, logout user
            this.storageService.clean();
            this.router.navigate(['/login']).then();
            this.eventBusService.emit(new EventData('logout', null));

            return throwError(() => error);
          }));
      } else {
        this.isRefreshing = false;
        this.router.navigate(['/login']).then();
      }
    }

    return throwError(() => new Error('Unauthorized'));
  }

}
