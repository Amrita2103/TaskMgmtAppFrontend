import { HttpClient } from '@angular/common/http';
import { Injectable, Service } from '@angular/core';
import { loginRequest } from '../models/login-request';
import { Observable, tap } from 'rxjs';
import { loginResponse } from '../models/login-response';

@Injectable({
    providedIn:'root'
})

export class AuthService {
    private readonly apiUrl = 'api/auth';
    private accessToken: string | null = null;
    private expiresAtUtc: number | null = null;

    constructor (private http: HttpClient){}

    // login
    login(credentials: loginRequest):Observable<loginResponse>{
        return this.http.post<loginResponse>(
            `${this.apiUrl}/login`, credentials
        ).pipe(
            tap(response => {
                const expiration = Date.parse(response.expiresAtUtc);
            
                if(!response.accessToken || !Number.isFinite(expiration) || expiration <= Date.now()){
                    throw new Error('Invalid authentication response');
                }

                this.accessToken = response.accessToken;
                this.expiresAtUtc = expiration;
            })            
        )
    }

    //Retrieve JWT
    getAccessToken(): string | null{
        if(!this.accessToken || this.expiresAtUtc === null || Date.now() >= this.expiresAtUtc){
            this.logout();
            return null;
        }
        return this.accessToken;
    }

    //check authentication state
    isAuthenicated(): boolean {
        return this.getAccessToken() !== null;
    }

    // Logout
    logout(): void {
        this.accessToken = null;
        this.expiresAtUtc = null;
    }
}
