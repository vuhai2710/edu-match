import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';
import { GoogleAuthButtonComponent } from '../../shared/google-auth-button.component';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, GoogleAuthButtonComponent],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly passwordVisible = signal(false);

  protected readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.pattern(/^[0-9+\s()-]{9,20}$/)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  protected submit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { fullName, email, phoneNumber, password } = this.registerForm.getRawValue();

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const redirectUrl = this.route.snapshot.queryParamMap.get('redirect') || '/tutors';
          this.loading.set(false);
          void this.router.navigateByUrl(redirectUrl);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected showError(controlName: 'fullName' | 'email' | 'phoneNumber' | 'password'): boolean {
    const control = this.registerForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  protected getErrorMessage(controlName: 'fullName' | 'email' | 'phoneNumber' | 'password'): string {
    const control = this.registerForm.controls[controlName];

    if (control.hasError('required')) {
      switch (controlName) {
        case 'fullName':
          return 'Vui lòng nhập họ và tên.';
        case 'email':
          return 'Vui lòng nhập email.';
        case 'password':
          return 'Vui lòng nhập mật khẩu.';
        default:
          return 'Trường này là bắt buộc.';
      }
    }

    if (control.hasError('email')) {
      return 'Email không đúng định dạng.';
    }

    if (control.hasError('minlength')) {
      return controlName === 'password'
        ? 'Mật khẩu cần ít nhất 6 ký tự.'
        : 'Họ và tên cần ít nhất 2 ký tự.';
    }

    if (control.hasError('pattern')) {
      return 'Số điện thoại không hợp lệ.';
    }

    return 'Giá trị không hợp lệ.';
  }
}
