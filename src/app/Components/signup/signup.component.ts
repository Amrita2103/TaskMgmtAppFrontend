import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth.service';

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Limits mirror UserSignUpDto: Name/Email required, max 256, Email must be valid.
  // The backend only requires a password; the 8-char minimum is a client-side rule.
  signupForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(256)]
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(256)]
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)]
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required]
      })
    },
    { validators: passwordsMatch }
  );

  isSubmitting = false;
  errorMessage = '';

  onSubmit(): void {
    if (this.signupForm.invalid || this.isSubmitting) {
      this.signupForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { name, email, password } = this.signupForm.getRawValue();

    this.authService
      .signup({ name: name.trim(), email: email.trim(), password })
      .pipe(finalize(() => (this.isSubmitting = false)))
      .subscribe({
        next: () => this.router.navigateByUrl('/home'),
        error: (error: HttpErrorResponse) => {
          if (error.status === 409) {
            this.errorMessage = 'An account with this email already exists.';
          } else if (error.status === 400) {
            this.errorMessage = 'Please check your details and try again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to the server.';
          } else {
            this.errorMessage = 'Sign up failed. Please try again.';
          }
        }
      });
  }
}
