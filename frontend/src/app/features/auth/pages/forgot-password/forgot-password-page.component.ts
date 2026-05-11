import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ForgotPasswordPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authSession = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly submittedEmail = signal<string | null>(null);
  protected readonly successMessage = signal<string | null>(null);

  protected readonly requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  protected submit(): void {
    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.sendResetRequest(this.requestForm.getRawValue().email.trim());
  }

  protected resend(): void {
    const email = this.submittedEmail();
    if (!email || this.loading()) {
      return;
    }

    this.sendResetRequest(email);
  }

  protected resetState(): void {
    this.submittedEmail.set(null);
    this.successMessage.set(null);
    this.errorMessage.set(null);
  }

  protected showError(): boolean {
    const control = this.requestForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  private sendResetRequest(email: string): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .requestPasswordReset({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          this.loading.set(false);
          this.submittedEmail.set(email);
          this.successMessage.set(message);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }
}
