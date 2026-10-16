import { HttpClient } from '@angular/common/http';
import { Injectable, Service } from '@angular/core';
import { loginRequest } from '../models/login-request';
import { Observable } from 'rxjs';
import { loginResponse } from '../models/login-response';

@Injectable({
    providedIn:'root'
})

export class AuthService {
    private readonly apiUrl = 'api/auth';
    constructor (private http: HttpClient){}

    login(credentials: loginRequest):Observable<loginResponse>{
        return this.http.post<loginResponse>(
            `${this.apiUrl}/login`, credentials
        );
    }
}
