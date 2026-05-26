export enum UserRole {
  Student = 'Student',
  Tutor = 'Tutor',
  Admin = 'Admin',
}

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export interface SessionUser {
  id: number;
  fullName: string;
  birth?: number | null;
  email: string;
  school?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
  gender?: number | string | null;
  isActive: boolean;
  isGoogleAccount?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken?: string;
  accessToken?: string;
  requestedRole?: UserRole;
  registrationIntent: boolean;
}

export interface RefreshTokenRequest extends SessionTokens {}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ValidateResetTokenResponse {
  isValid: boolean;
}

export interface LoginResponseDto extends SessionTokens {
  user: SessionUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode?: number | null;
  data?: T;
}
