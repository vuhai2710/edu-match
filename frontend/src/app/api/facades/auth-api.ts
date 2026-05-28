import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENV } from '../../core/config/app-env';
import {
  AcademicDegree,
  EducationLevel,
  Gender,
  Grade,
  TutorCareerStatus,
} from '../generated/client/models';
import {
  ApiResponse,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LoginResponseDto,
  LogoutRequest,
  RefreshTokenRequest,
  ResetPasswordRequest,
  SessionUser,
  ValidateResetTokenResponse,
} from '../../core/auth/session.models';

export interface RegisterAddressPayload {
  provinceId: number;
  provinceName: string;
  wardCode: string;
  wardName: string;
  addressDetail?: string | null;
}

export interface RegisterStudentPayload {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  gender: Gender;
  address: RegisterAddressPayload;
  avatar?: File | null;
  gradeLevel?: Grade | null;
}

export interface RegisterTutorPayload extends RegisterStudentPayload {
  avatar: File;
  cv: File;
  profile?: string | null;
  hourlyRate: number;
  subjectIds: number[];
  teachingLevels: EducationLevel[];
  careerStatus: TutorCareerStatus;
  major: string;
  academicDegree: AcademicDegree;
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(APP_ENV);
  private readonly baseUrl = `${this.environment.apiBaseUrl}/api/auth`;

  login(payload: LoginRequest): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.baseUrl}/login`, payload);
  }

  googleLogin(payload: GoogleLoginRequest): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(`${this.baseUrl}/google`, payload);
  }

  registerStudent(payload: RegisterStudentPayload): Observable<ApiResponse<LoginResponseDto>> {
    return this.http.post<ApiResponse<LoginResponseDto>>(
      `${this.baseUrl}/register/student`,
      this.toStudentFormData(payload),
    );
  }

  registerTutor(payload: RegisterTutorPayload): Observable<ApiResponse<LoginResponseDto>> {
    const formData = this.toStudentFormData({ ...payload, avatar: null });
    formData.append('Avatar', payload.avatar);
    formData.append('Cv', payload.cv);

    if (payload.profile?.trim()) {
      formData.append('Profile', payload.profile.trim());
    }

    formData.append('HourlyRate', String(payload.hourlyRate));
    formData.append('CareerStatus', payload.careerStatus);
    formData.append('Major', payload.major.trim());
    formData.append('AcademicDegree', payload.academicDegree);
    payload.subjectIds.forEach((subjectId) => formData.append('SubjectIds', String(subjectId)));
    payload.teachingLevels.forEach((level) => formData.append('TeachingLevels', level));

    return this.http.post<ApiResponse<LoginResponseDto>>(
      `${this.baseUrl}/register/tutor`,
      formData,
    );
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

  private toStudentFormData(payload: RegisterStudentPayload): FormData {
    const formData = new FormData();
    formData.append('FullName', payload.fullName.trim());
    formData.append('Email', payload.email.trim());
    formData.append('Password', payload.password);
    formData.append('PhoneNumber', payload.phoneNumber.trim());
    formData.append('Gender', payload.gender);
    formData.append('ProvinceId', String(payload.address.provinceId));
    formData.append('ProvinceName', payload.address.provinceName);
    formData.append('WardCode', payload.address.wardCode);
    formData.append('WardName', payload.address.wardName);

    if (payload.address.addressDetail?.trim()) {
      formData.append('AddressDetail', payload.address.addressDetail.trim());
    }

    if (payload.avatar) {
      formData.append('Avatar', payload.avatar);
    }

    if (payload.gradeLevel) {
      formData.append('GradeLevel', payload.gradeLevel);
    }

    return formData;
  }
}
