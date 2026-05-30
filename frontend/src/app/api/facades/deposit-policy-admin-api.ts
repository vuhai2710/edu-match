import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { APP_ENV } from '../../core/config/app-env';
import {
  DepositPolicyDto,
  DepositPolicyDtoApiResponse,
  UpsertDepositPolicyDto,
} from '../generated/client/models';

export interface DepositPolicyPagedResult {
  items?: DepositPolicyDto[];
  totalCount?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

interface PagedResultApiResponse<T> {
  success?: boolean;
  message?: string | null;
  statusCode?: number | null;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class DepositPolicyAdminApiService {
  private readonly http = inject(HttpClient);
  private readonly environment = inject(APP_ENV);
  private readonly baseUrl = `${this.environment.apiBaseUrl}/api/deposit-policy/admin`;

  getCurrent(): Observable<DepositPolicyDtoApiResponse> {
    return this.http.get<DepositPolicyDtoApiResponse>(`${this.baseUrl}/current`);
  }

  getHistory(page: number, pageSize: number): Observable<PagedResultApiResponse<DepositPolicyPagedResult>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('pageSize', String(pageSize));
    return this.http.get<PagedResultApiResponse<DepositPolicyPagedResult>>(`${this.baseUrl}/history`, { params });
  }

  getById(id: number): Observable<DepositPolicyDtoApiResponse> {
    return this.http.get<DepositPolicyDtoApiResponse>(`${this.baseUrl}/${id}`);
  }

  create(dto: UpsertDepositPolicyDto): Observable<DepositPolicyDtoApiResponse> {
    return this.http.post<DepositPolicyDtoApiResponse>(this.baseUrl, dto);
  }

  update(id: number, dto: UpsertDepositPolicyDto): Observable<DepositPolicyDtoApiResponse> {
    return this.http.put<DepositPolicyDtoApiResponse>(`${this.baseUrl}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
