import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Register } from '../model/register.model';
import { Login } from '../model/login.model';

const BASE_URL = 'http://localhost:8080/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
  }

  login(login: Login): Observable<HttpResponse<any>> {
    return this.http.post<any>(`${BASE_URL}/login`, login, {observe: 'response', responseType: 'json'})
      .pipe(tap(res => {
        this.storeToken(res.body.token);
        const loggedUser = {
          fullName: res.body.fullName,
          email: res.body.email
        };
        localStorage.setItem('loggedUser', JSON.stringify(loggedUser));
        }));
  }

  refreshToken(token: string): Observable<HttpResponse<string>> {
    return this.http.get(`${BASE_URL}/refresh-token?token=${token}`, {observe: 'response', responseType: 'text'});
  }

  register(register: Register): Observable<HttpResponse<string>> {
    return this.http.post(`${BASE_URL}/addNewUser`, register, {observe: 'response', responseType: 'text'});
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('loggedUser');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  private clearToken(): void {
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
    }
  }

  private storeToken(token: string): void {
    if (token) localStorage.setItem('token', token);
  }

}
