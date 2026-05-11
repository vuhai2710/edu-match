import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  ViewChild,
  inject,
  input,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { environment } from '../../../../environments/environment';
import { AuthSessionService } from '../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../core/http/http-error.utils';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
}

interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: GoogleButtonText;
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: string | number;
  logo_alignment?: 'left' | 'center';
  locale?: string;
}

interface GoogleAccountsIdApi {
  initialize(configuration: GoogleIdConfiguration): void;
  renderButton(parent: HTMLElement, options: GoogleButtonConfiguration): void;
}

interface GoogleAccountsNamespace {
  accounts: {
    id?: GoogleAccountsIdApi;
  };
}

declare global {
  interface Window {
    google?: GoogleAccountsNamespace;
  }
}

@Component({
  selector: 'app-google-auth-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-auth">
      @if (configurationError()) {
        <p class="auth-feedback auth-feedback--error">{{ configurationError() }}</p>
      } @else {
        @if (loading()) {
          <button class="auth-button auth-button--secondary" type="button" disabled>
            Đang kết nối Google...
          </button>
        }
        <div class="google-auth__button" [class.google-auth__button--hidden]="loading()">
          <div #buttonHost></div>
        </div>
      }

      @if (errorMessage()) {
        <p class="auth-feedback auth-feedback--error">{{ errorMessage() }}</p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleAuthButtonComponent implements AfterViewInit {
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);

  readonly buttonText = input<GoogleButtonText>('signin_with');
  readonly redirectFallback = input('/tutors');
  readonly rememberSession = input(true);

  protected readonly loading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly configurationError = signal<string | null>(null);

  @ViewChild('buttonHost') private readonly buttonHost?: ElementRef<HTMLElement>;

  async ngAfterViewInit(): Promise<void> {
    await new Promise<void>((resolve) => queueMicrotask(() => resolve()));

    const googleClientId = environment.googleClientId.trim();
    if (!googleClientId) {
      this.configurationError.set('Google đăng nhập chưa được cấu hình. Hãy cập nhật `googleClientId` trong environment.');
      return;
    }

    try {
      await this.loadGoogleIdentityScript();
    } catch {
      this.configurationError.set('Không thể tải Google Identity Services trong môi trường hiện tại.');
      return;
    }

    const host = this.buttonHost?.nativeElement;
    if (!host) {
      console.error('Google Identity Services render host was not found.');
      this.configurationError.set('Google Identity Services không tìm thấy vùng render nút.');
      return;
    }

    const googleApi = await this.waitForGoogleApi();
    if (!googleApi) {
      console.error('Google Identity Services script loaded but API is unavailable.', {
        hasGoogle: Boolean(window.google),
        hasAccounts: Boolean(window.google?.accounts),
        hasId: Boolean(window.google?.accounts?.id)
      });
      this.configurationError.set(
        'Google Identity Services đã tải script nhưng chưa khởi tạo API. Hãy thử tắt extension chặn script/cookie và tải lại trang.'
      );
      return;
    }

    host.innerHTML = '';
    const containerWidth = Math.round(host.parentElement?.getBoundingClientRect().width || 0);
    const hostWidth = Math.min(360, Math.max(300, containerWidth - 48));

    googleApi.initialize({
      client_id: googleClientId,
      callback: (response) => {
        this.zone.run(() => this.handleCredentialResponse(response));
      }
    });

    googleApi.renderButton(host, {
      theme: 'outline',
      size: 'medium',
      text: this.buttonText(),
      shape: 'rectangular',
      width: hostWidth,
      logo_alignment: 'center',
      locale: 'vi'
    });
  }

  private handleCredentialResponse(response: GoogleCredentialResponse): void {
    if (!response.credential) {
      this.errorMessage.set('Google không trả về credential hợp lệ.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    this.authSession
      .googleLogin(response.credential, this.rememberSession())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.loading.set(false);
          const redirectUrl =
            this.route.snapshot.queryParamMap.get('redirect') ||
            (this.authSession.isAdmin() ? '/admin/payments' : this.redirectFallback());
          void this.router.navigateByUrl(redirectUrl);
        },
        error: (error: unknown) => {
          this.loading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }

  private loadGoogleIdentityScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    const existingScript = document.getElementById('google-identity-services') as HTMLScriptElement | null;
    if (existingScript) {
      if (existingScript.dataset['loaded'] === 'true') {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load GIS script.')), {
          once: true
        });
      });
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        script.dataset['loaded'] = 'true';
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load GIS script.'));
      document.head.appendChild(script);
    });
  }

  private async waitForGoogleApi(): Promise<GoogleAccountsIdApi | null> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const googleApi = window.google?.accounts?.id;
      if (googleApi) {
        return googleApi;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 100));
    }

    return null;
  }
}
