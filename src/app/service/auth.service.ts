import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { RegisterModel } from '../model/register.model';
import { LoginModel } from '../model/login.model';
import { StorageService } from './storage.service';

const BASE_URL = 'http://localhost:8080/api';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedInSubject = new BehaviorSubject<boolean>(false);
  public loggedIn$ = this.loggedInSubject.asObservable();

  constructor(private http: HttpClient, private storageService: StorageService) {
    // Initialize with current login status
    this.loggedInSubject.next(this.storageService.isLoggedIn());
  }

  get isLoggedIn(): boolean {
    return this.storageService.isLoggedIn();
  }

  setLoggedIn(status: boolean): void {
    this.loggedInSubject.next(status);
  }

  login(login: LoginModel): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/login`, login, httpOptions).pipe(
      tap(() => this.setLoggedIn(true))
    );
  }

  register(register: RegisterModel): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/user`, register, httpOptions);
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/logout`, {}, httpOptions).pipe(
      tap(() => {
        this.storageService.clean();
        this.setLoggedIn(false);
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/refresh-token`, {}, httpOptions);
  }

}
