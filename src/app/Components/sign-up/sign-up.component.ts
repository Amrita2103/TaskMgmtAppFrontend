import { Component, inject, EventEmitter, Output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators
} from '@angular/forms';

import { ApiProblem } from '../../models/auth.models';
import { AuthService } from '../../services/auth.service';

// Fails when the value is only spaces 
function notBlank(control: AbstractControl): ValidationErrors | null {
const value = control.value as string;
return value && value.trim().length === 0 ? { blank: true } : null;
}

// confirm password must equal password.
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
const password = group.get('password')?.value;
const confirm = group.get('confirmPassword')?.value;
return password === confirm ? null : { passwordMismatch: true };
}

type FieldName = 'name' | 'email' | 'password' | 'confirmPassword';

@Component({
  selector: 'app-sign-up',
  
  standalone: false,
  styleUrl: './sign-up.component.scss',
  templateUrl: './sign-up.component.html',
})
export class SignUpComponent {
private readonly fb = inject(FormBuilder);
private readonly auth = inject(AuthService);
//Event sent to the App when sign-up succeeds
@Output() signedUp = new EventEmitter<void>();


readonly loading = signal(false); // true while the request is running
readonly errorMessage = signal<string | null>(null); 
readonly showPassword = signal(false); // toggles password visibility

// Rules mirror the backend DTO attributes 
readonly form = this.fb.nonNullable.group(
{
name: ['', [Validators.required, notBlank, Validators.minLength(2), Validators.maxLength(256)]],
email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
password: ['', [
Validators.required,
Validators.minLength(8),
Validators.maxLength(100),
Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/) // same regex as the backend
]],
confirmPassword: ['', [Validators.required]] // frontend only, never sent to the API
},
{ validators: passwordsMatch }
);

onSubmit(): void {
if (this.form.invalid) {
this.form.markAllAsTouched(); // reveal all validation messages
return;
}

this.loading.set(true);
this.errorMessage.set(null);

const { name, email, password } = this.form.getRawValue();

this.auth.signUp({ name: name.trim(), email: email.trim(), password }).subscribe({
next: () => {
this.loading.set(false);
this.signedUp.emit(); // to tell the parent
},
error: (err: HttpErrorResponse) => {
this.loading.set(false);
this.handleError(err);
}
});
}

// Translates API errors into messages the user can understand.
private handleError(err: HttpErrorResponse): void {
const problem = err.error as ApiProblem | null;

// Status 0 means the browser never got a response 
if (err.status === 0) {
this.errorMessage.set('Cannot reach the server. Check that the API is running and try again.');
return;
}

// 400: show the server's field messages under the matching inputs.
if (err.status === 400 && problem?.errors) {
let matched = false;
for (const [field, messages] of Object.entries(problem.errors)) {
const controlName = field.charAt(0).toLowerCase() + field.slice(1); // "Email" -> "email"
const control = this.form.get(controlName);
if (control) {
control.setErrors({ server: messages[0] }); // cleared automatically when the user edits the field
control.markAsTouched();
matched = true;
}
}
this.errorMessage.set(matched ? 'Please fix the highlighted fields.'
: (problem.title ?? 'The request was invalid.'));
return;
}

// 409: email already registered. The API puts the message in "detail".
if (err.status === 409) {
this.errorMessage.set(problem?.detail ?? 'An account with this email already exists.');
return;
}

// Anything else (500 etc.): show the generic message from the API.
this.errorMessage.set(problem?.detail ?? 'Something went wrong. Please try again.');
}

// Returns the message to show under a field, or null if there is none.
fieldError(field: FieldName): string | null {
const control = this.form.controls[field];
if (!control.touched || !control.errors) return null; // only show after the user interacted
const e = control.errors;
if (e['server']) return e['server'];
if (e['required'] || e['blank']) return 'This field is required.';
if (e['minlength']) return `Minimum ${e['minlength'].requiredLength} characters.`;
if (e['maxlength']) return `Maximum ${e['maxlength'].requiredLength} characters.`;
if (e['email']) return 'Enter a valid email address.';
if (e['pattern']) return 'Use an uppercase letter, a lowercase letter and a digit.';
return null;
}

// True when the passwords differ and the user has touched the confirm field.
passwordMismatch(): boolean {
return this.form.hasError('passwordMismatch') && this.form.controls.confirmPassword.touched;
}}
