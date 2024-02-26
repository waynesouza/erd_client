import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RegisterModel } from '../model/register.model';
import { LoginModel } from '../model/login.model';

const BASE_URL = 'http://localhost:6868/api';
const httpOptions = { headers: new HttpHeaders({'Content-Type': 'application/json'}) };

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(login: LoginModel): Observable<any> {
    return this.http.post<any>(`${BASE_URL}/auth/login`, login, httpOptions);

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
