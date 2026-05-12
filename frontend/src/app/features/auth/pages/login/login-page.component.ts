import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { UserRole } from '../../../../../api/generated';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';
import { GoogleAuthButtonComponent } from '../../shared/google-auth-button.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleAuthButtonComponent],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);
  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly isAdmin = this.authSession.isAdmin;

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    rememberMe: [true]
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, rememberMe } = this.loginForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .login({ email, password }, rememberMe)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.completePostAuthFlow(),
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected showError(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getErrorMessage(controlName: 'email' | 'password'): string {
    const control = this.loginForm.controls[controlName];

    if (control.hasError('required')) {
      return controlName === 'email' ? 'Vui lòng nhập email.' : 'Vui lòng nhập mật khẩu.';
    }

    if (control.hasError('email')) {
      return 'Email không đúng định dạng.';
    }

    return 'Giá trị không hợp lệ.';
  }

  protected authQueryParams(): Record<string, string> {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    const intent = this.route.snapshot.queryParamMap.get('intent');

    return {
      ...(redirect ? { redirect } : {}),
      ...(intent ? { intent } : {})
    };
  }

  private completePostAuthFlow(): void {
    const redirectUrl =
      this.route.snapshot.queryParamMap.get('redirect') ||
      (this.authSession.isAdmin() ? '/admin/payments' : '/tutors');
    const intent = this.route.snapshot.queryParamMap.get('intent');
    const role = this.authSession.currentUser()?.role;
    const shouldBecomeTutor = intent === 'become-tutor' && role !== UserRole.Tutor && role !== UserRole.Admin;

    if (!shouldBecomeTutor) {
      this.loading.set(false);
      void this.router.navigateByUrl(redirectUrl);
      return;
    }

    this.authSession
      .becomeTutor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          void this.router.navigateByUrl(redirectUrl);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }
}
