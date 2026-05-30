import { Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';

import { GoogleIdentityService } from '../../../core/auth/google-identity';

@Component({
  selector: 'app-google-sign-in-button',
  template: `
    <button type="button"
            [disabled]="!isConfigured || isLoading()"
            (click)="onClick()"
            class="flex h-12 w-full items-center justify-center rounded-xl border-2 border-[#e5e5e5] border-b-[5px] border-b-[#cbd5e1] bg-[#f3f7fb] px-6 font-din text-[15px] font-extrabold uppercase tracking-[0.053em] text-[#3c3c3c] transition-[background,transform,border] hover:bg-[#eef3f8] active:translate-y-1 active:border-b-2 disabled:cursor-not-allowed disabled:opacity-60">
      <span class="inline-flex items-center justify-center gap-3 whitespace-nowrap">
        <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.997 10.997 0 0 0 12 23z" fill="#34A853" />
          <path d="M5.84 14.09A6.614 6.614 0 0 1 5.49 12c0-.73.13-1.43.35-2.09V7.07H2.18A10.997 10.997 0 0 0 1 12c0 1.78.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A10.997 10.997 0 0 0 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" fill="#EA4335" />
        </svg>
        <span>{{ isLoading() ? 'Đang mở Google...' : label }}</span>
      </span>
    </button>

    @if (errorMessage()) {
      <p class="mt-2 rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
        {{ errorMessage() }}
      </p>
    }
  `,
})
export class GoogleSignInButtonComponent {
  @Input() text: 'signin_with' | 'signup_with' | 'continue_with' = 'continue_with';
  @Output() credential = new EventEmitter<string>();

  protected readonly errorMessage = signal('');
  protected readonly isLoading = signal(false);

  private readonly googleIdentity = inject(GoogleIdentityService);

  get isConfigured(): boolean {
    return this.googleIdentity.isConfigured();
  }

  get label(): string {
    if (!this.isConfigured) {
      return 'Google Client ID chưa được cấu hình';
    }

    return 'Tiếp tục với Google';
  }

  async onClick(): Promise<void> {
    if (!this.isConfigured || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const credential = await this.googleIdentity.requestCredential();
      this.errorMessage.set('');
      this.credential.emit(credential);
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error ? error.message : 'Không khởi tạo được Google login.',
      );
    } finally {
      this.isLoading.set(false);
    }
  }
}
