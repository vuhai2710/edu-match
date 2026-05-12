import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

import {
  ApiResponse,
  AuthApi,
  BecomeTutorDto,
  ForgotPasswordRequestDto,
  GoogleAuthResponseDto,
  LoginDto,
  LoginResponseDto,
  ResetPasswordRequestDto,
  RegisterDto,
  StudentsApi,
  UserDto,
  UserRole
} from '../../../api/generated';
import { unwrapApiResponse } from '../../shared/utils/api-response.utils';
import { AuthSession } from './auth-session.models';
import { TokenStorageService } from './token-storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private readonly authApi = inject(AuthApi);
  private readonly studentsApi = inject(StudentsApi);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly sessionState = signal<AuthSession | null>(this.tokenStorage.load());

  readonly session = this.sessionState.asReadonly();
  readonly currentUser = computed(() => this.sessionState()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this.sessionState()?.accessToken));
  readonly isAdmin = computed(() => this.currentUser()?.role === UserRole.Admin);

  login(credentials: LoginDto, rememberSession: boolean = true): Observable<LoginResponseDto> {
    return this.authApi.login({ loginDto: credentials }).pipe(
      map((response) => unwrapApiResponse(response)),
      tap((response) => this.persistSession(response, rememberSession))
    );
  }

  register(payload: RegisterDto): Observable<LoginResponseDto> {
    return this.authApi.register({ registerDto: payload }).pipe(
      map((response) => unwrapApiResponse(response)),
      tap((response) => this.persistSession(response, true))
    );
  }

  googleLogin(idToken: string, rememberSession: boolean = true): Observable<GoogleAuthResponseDto> {
    return this.authApi.googleLogin({ googleLoginRequestDto: { idToken } }).pipe(
      map((response) => unwrapApiResponse(response)),
      tap((response) => this.persistGoogleSession(response, rememberSession))
    );
  }

  requestPasswordReset(payload: ForgotPasswordRequestDto): Observable<string> {
    return this.authApi.forgotPassword({ forgotPasswordRequestDto: payload }).pipe(
      map((response) => this.resolveApiMessage(response, 'Yeu cau dat lai mat khau da duoc gui thanh cong.'))
    );
  }

  validateResetToken(token: string): Observable<boolean> {
    return this.authApi.validateResetToken({ token }).pipe(
      map((response) => unwrapApiResponse(response)),
      map((response) => Boolean(response.isValid))
    );
  }

  resetPassword(payload: ResetPasswordRequestDto): Observable<string> {
    return this.authApi.resetPassword({ resetPasswordRequestDto: payload }).pipe(
      map((response) => this.resolveApiMessage(response, 'Mat khau da duoc dat lai thanh cong.'))
    );
  }

  becomeTutor(payload: BecomeTutorDto = {}): Observable<string> {
    return this.studentsApi.becomeTutor({ becomeTutorDto: payload }).pipe(
      map((response) => this.resolveApiMessage(response, 'Yeu cau tro thanh gia su da duoc gui thanh cong.')),
      switchMap((message) =>
        this.refreshCurrentUser().pipe(
          map(() => message),
          catchError(() => of(message))
        )
      )
    );
  }

  refreshCurrentUser(): Observable<UserDto> {
    return this.authApi.getCurrentUser().pipe(
      map((response) => unwrapApiResponse(response)),
      tap((user) => {
        const currentSession = this.sessionState();
        if (!currentSession) {
          return;
        }

        const nextSession: AuthSession = {
          ...currentSession,
          user
        };
        this.tokenStorage.save(nextSession);
        this.sessionState.set(nextSession);
      })
    );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.sessionState.set(null);
  }

  private persistSession(response: LoginResponseDto, rememberSession: boolean): void {
    if (!response.accessToken) {
      throw new Error('Backend login response did not include an access token.');
    }

    const session: AuthSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken ?? '',
      user: response.user ?? null
    };

    this.tokenStorage.save(session, rememberSession);
    this.sessionState.set(session);
  }

  private persistGoogleSession(response: GoogleAuthResponseDto, rememberSession: boolean): void {
    if (!response.token) {
      throw new Error('Backend Google login response did not include an access token.');
    }

    const session: AuthSession = {
      accessToken: response.token,
      refreshToken: '',
      user: response.user ?? null
    };

    this.tokenStorage.save(session, rememberSession);
    this.sessionState.set(session);
  }

  private resolveApiMessage(response: ApiResponse, fallbackMessage: string): string {
    if (response.success === false) {
      throw new Error(response.message || 'The API reported a failed response.');
    }

    return response.message || fallbackMessage;
  }
}
