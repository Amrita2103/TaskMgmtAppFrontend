import { Component } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';

import {
  FormControl,
  FormGroup,
  Validators
} from '@angular/forms';

import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
 
  loginForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email]
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  isSubmitting = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  onSubmit(): void {

    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;

    this.errorMessage = '';
    this.successMessage = '';

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials)
      .pipe(
        finalize(() => {
          this.isSubmitting = false;
        })
      )
      .subscribe({

        next: (response) => {

          if (!response.accessToken) {
            this.errorMessage = 'Unexpected server response.';
            return;
          }
          this.loginForm.controls.password.reset();
          this.router.navigateByUrl(this.getSafeReturnUrl());
        },

        error: (error: HttpErrorResponse) => {

          if (error.status === 401) {
            this.errorMessage = 'Invalid email or password.';
          }
          else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to the server.';
          }
          else {
            this.errorMessage = 'Login failed. Please try again.';
          }
        }
      });
  }

  // Only allow in-app paths, so ?returnUrl=https://evil.com can't redirect away.
  private getSafeReturnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl');
    return url && url.startsWith('/') && !url.startsWith('//') ? url : '/home';
  }
}
