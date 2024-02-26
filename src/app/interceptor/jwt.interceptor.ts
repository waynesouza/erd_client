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
    request = request.clone({
      withCredentials: true
    });

    return next.handle(request)
      .pipe(catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401 && !request.url.includes('/auth/login')) {
          return this.handleUnauthorized(request, next);
        }

        return throwError(() => error);
      }));
  }

  private handleUnauthorized(request: HttpRequest<any>, next: HttpHandler) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      if (this.storageService.isLoggedIn()) {
        return this.authService.refreshToken()
          .pipe(switchMap(() => {
            this.isRefreshing = false;

            return next.handle(request);
          }), catchError((error) => {
            this.isRefreshing = false;
            console.log(error);
            if (error.status === 403) {
              this.eventBusService.emit(new EventData('logout', null));
            }
            return throwError(() => error);
          }));
      }
    }

    return next.handle(request);
  }

}
