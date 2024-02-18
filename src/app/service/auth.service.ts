import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Register } from '../model/register.model';
import { Login } from '../model/login.model';

const BASE_URL = 'http://localhost:8080/auth';

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    constructor(private http: HttpClient) { }

    login(login: Login): Observable<HttpResponse<string>> {
        return this.http.post(`${BASE_URL}/login`, login, { observe: 'response', responseType: 'text' })
          .pipe(tap(res => this.storeToken(res.body)));
    }

    register(register: Register): Observable<HttpResponse<string>> {
        return this.http.post(`${BASE_URL}/addNewUser`, register, { observe: 'response', responseType: 'text' });
    }

    logout(): void {
        localStorage.removeItem('token');
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    private storeToken(token: string | null): void {
        if (token) localStorage.setItem('token', token);
    }

}
