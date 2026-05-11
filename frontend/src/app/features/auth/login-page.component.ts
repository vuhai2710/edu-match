import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../core/http/http-error.utils';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
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
  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly isAdmin = this.authSession.isAdmin;

  protected readonly loginForm = this.fb.nonNullable.group({
    email: ['admin@gmail.com', [Validators.required, Validators.email]],
    password: ['123456', [Validators.required]]
  });

  protected submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .login(this.loginForm.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          const redirectUrl = this.route.snapshot.queryParamMap.get('redirect') || '/admin/payments';
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
