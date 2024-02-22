import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { lastValueFrom, Observable, tap } from 'rxjs';
import { RegisterModel } from '../model/register.model';
import { LoginModel } from '../model/login.model';
import { AuthResponseModel } from "../model/auth-response.model";

const BASE_URL = 'http://localhost:8080/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) {
  }

  async login(login: LoginModel): Promise<Observable<HttpResponse<AuthResponseModel>>> {
    const response: any = await this.http.post<AuthResponseModel>(`${BASE_URL}/login`, login, {
      observe: 'response',
      responseType: 'json'
    });

    if (response.body) {
      this.storeToken(response.body.token);
      const loggedUser = {
        fullName: response.body.fullName,
        email: response.body.email
      };
      localStorage.setItem('loggedUser', JSON.stringify(loggedUser));
    }

    return response;
  }

  register(register: RegisterModel): Observable<HttpResponse<string>> {
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
