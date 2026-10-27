import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ApiProblem } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

function notBlank(control: AbstractControl): ValidationErrors | null {
  return typeof control.value === 'string' && !control.value.trim() ? { blank: true } : null;
}

function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-signup',
  standalone: false,
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Validate account details before submitting them to the API.
  signupForm = new FormGroup(
    {
      name: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          notBlank,
          Validators.minLength(2),
          Validators.maxLength(256),
        ],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email, Validators.maxLength(256)],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(100),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/),
        ],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: passwordsMatch },
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
            const problem = error.error as ApiProblem | null;
            for (const [field, messages] of Object.entries(problem?.errors ?? {})) {
              const key = field.charAt(0).toLowerCase() + field.slice(1);
              const control = this.signupForm.get(key);
              if (control && messages.length) {
                control.setErrors({ server: messages[0] });
                control.markAsTouched();
              }
            }
            this.errorMessage = problem?.title ?? 'Please check your details and try again.';
          } else if (error.status === 0) {
            this.errorMessage = 'Unable to connect to the server.';
          } else {
            this.errorMessage = 'Sign up failed. Please try again.';
          }
        },
      });
  }
}
