import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResetPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly token = this.route.snapshot.queryParamMap.get('token')?.trim() ?? '';

  protected readonly loading = signal(false);
  protected readonly checkingToken = signal(true);
  protected readonly tokenValid = signal(false);
  protected readonly success = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);
  protected readonly confirmPasswordVisible = signal(false);

  protected readonly resetForm = this.fb.nonNullable.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  });

  constructor() {
    this.validateToken();
  }

  protected submit(): void {
    if (this.resetForm.invalid || this.passwordMismatch()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .resetPassword({
        token: this.token,
        newPassword: this.resetForm.controls.newPassword.getRawValue()
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          this.loading.set(false);
          this.success.set(true);
          this.successMessage.set(message);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((value) => !value);
  }

  protected toggleConfirmPasswordVisibility(): void {
    this.confirmPasswordVisible.update((value) => !value);
  }

  protected showError(controlName: 'newPassword' | 'confirmPassword'): boolean {
    const control = this.resetForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected passwordMismatch(): boolean {
    const { newPassword, confirmPassword } = this.resetForm.getRawValue();
    return Boolean(confirmPassword) && newPassword !== confirmPassword;
  }

  protected showPasswordMismatch(): boolean {
    const confirmControl = this.resetForm.controls.confirmPassword;
    return this.passwordMismatch() && (confirmControl.dirty || confirmControl.touched);
  }

  protected getErrorMessage(controlName: 'newPassword' | 'confirmPassword'): string {
    const control = this.resetForm.controls[controlName];

    if (control.hasError('required')) {
      return controlName === 'newPassword' ? 'Vui lòng nhập mật khẩu mới.' : 'Vui lòng xác nhận mật khẩu mới.';
    }

    if (control.hasError('minlength')) {
      return 'Mật khẩu mới cần ít nhất 6 ký tự.';
    }

    return 'Giá trị không hợp lệ.';
  }

  private validateToken(): void {
    if (!this.token) {
      this.checkingToken.set(false);
      this.tokenValid.set(false);
      this.errorMessage.set('Liên kết đặt lại mật khẩu không hợp lệ hoặc đã bị thiếu token.');
      return;
    }

    this.authSession
      .validateResetToken(this.token)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (isValid) => {
          this.checkingToken.set(false);
          this.tokenValid.set(isValid);
          if (!isValid) {
            this.errorMessage.set('Liên kết đặt lại mật khẩu đã hết hạn hoặc không còn hợp lệ.');
          }
        },
        error: (error: unknown) => {
          this.checkingToken.set(false);
          this.tokenValid.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }
}
