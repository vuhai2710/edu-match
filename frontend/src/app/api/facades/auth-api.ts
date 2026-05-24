import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENV } from '../../core/config/app-env';
import {
  ApiResponse,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponseDto,
  LogoutRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  SessionUser,
  ValidateResetTokenResponse,
} from '../../core/auth/session.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(APP_ENV);
  private readonly baseUrl = `${this.environment.apiBaseUrl}/api/Auth`;

  login(payload: LoginRequest): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.baseUrl}/login`, payload);
  }

  getCurrentUser(): Observable<ApiResponse<SessionUser>> {
    return this.http.get<ApiResponse<SessionUser>>(`${this.baseUrl}/me`);
  }

  refreshToken(
    payload: RefreshTokenRequest,
  ): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(
      `${this.baseUrl}/refresh-token`,
      payload,
    );
  }

  logout(payload: LogoutRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/logout`, payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/forgot-password`, payload);
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.baseUrl}/reset-password`, payload);
  }

  validateResetToken(token: string): Observable<ApiResponse<ValidateResetTokenResponse>> {
    return this.http.get<ApiResponse<ValidateResetTokenResponse>>(
      `${this.baseUrl}/validate-reset-token`,
      {
        params: { token },
      },
    );
  }
}
