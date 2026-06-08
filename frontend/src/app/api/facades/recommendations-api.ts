import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENV } from '../../core/config/app-env';
import { TutorDto } from '../generated/client/models';

export interface TutorRecommendationDto {
  tutor?: TutorDto | null;
  similarity?: number | null;
  reasons?: string[] | null;
}

export interface TutorRecommendationListDto {
  isFallback?: boolean;
  items?: TutorRecommendationDto[] | null;
}

interface ApiResponse<T> {
  success?: boolean;
  message?: string | null;
  statusCode?: number | null;
  data?: T | null;
}

export interface TutorRecommendationParams {
  subjectId?: number | null;
  provinceId?: number | null;
  wardCode?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  searchTerm?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RecommendationsApiService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(APP_ENV);
  private readonly baseUrl = `${this.environment.apiBaseUrl}/api/recommendations`;

  getTutorRecommendations(
    params: TutorRecommendationParams,
  ): Observable<ApiResponse<TutorRecommendationListDto>> {
    let httpParams = new HttpParams();

    if (params.subjectId != null) httpParams = httpParams.set('subjectId', String(params.subjectId));
    if (params.provinceId != null) httpParams = httpParams.set('provinceId', String(params.provinceId));
    if (params.wardCode) httpParams = httpParams.set('wardCode', params.wardCode);
    if (params.minPrice != null) httpParams = httpParams.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) httpParams = httpParams.set('maxPrice', String(params.maxPrice));
    if (params.searchTerm?.trim()) httpParams = httpParams.set('searchTerm', params.searchTerm.trim());

    return this.http.get<ApiResponse<TutorRecommendationListDto>>(`${this.baseUrl}/tutors`, {
      params: httpParams,
    });
  }
}

