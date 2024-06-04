import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, Subject, tap } from 'rxjs';
import { RegisterModel } from '../model/register.model';
import { LoginModel } from '../model/login.model';

const BASE_URL = 'http://localhost:8080/api';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private loggedIn = new Subject<void>()

  constructor(private http: HttpClient) { }

  get isLoggedIn() {
    return this.loggedIn.asObservable();
  }

  login(login: LoginModel): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/login`, login, httpOptions).pipe(tap(() => this.loggedIn.next()));
  }

  register(register: RegisterModel): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/user`, register, httpOptions);
  }

  logout(): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/logout`, {}, httpOptions);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/refresh-token`, {}, httpOptions);
  }

}
