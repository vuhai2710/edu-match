import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { GetTutorRequestsRequestParams, TutorRequestResponseDto, TutorRequestsApi } from '../../../../api/generated';
import { PagedCollection } from '../../../shared/types/paged-collection';
import { unwrapPagedResponse } from '../../../shared/utils/api-response.utils';

export interface TutorRequestListItemVm {
  id: number;
  code: string;
  studentName: string;
  subjectName: string;
  status: string;
  notePreview: string;
  pricePerSession: number;
  priceLabel: string;
  scheduleSummary: string;
  locationSummary: string;
  expiresAt: string;
  createdAt: string;
  applicationCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class TutorRequestsDataService {
  private readonly tutorRequestsApi = inject(TutorRequestsApi);

  list(params: GetTutorRequestsRequestParams = {}): Observable<PagedCollection<TutorRequestListItemVm>> {
    return this.tutorRequestsApi
      .getTutorRequests({
        page: 1,
        pageSize: 12,
        excludeExpired: true,
        ...params
      })
      .pipe(
        map((response) => unwrapPagedResponse(response)),
        map((page) => ({
          ...page,
          items: page.items.map((request) => this.mapRequest(request))
        }))
      );
  }

  private mapRequest(request: TutorRequestResponseDto): TutorRequestListItemVm {
    return {
      id: request.id ?? 0,
      code: request.code ?? 'N/A',
      studentName: request.studentName ?? 'Unknown student',
      subjectName: request.subjectName ?? 'Unknown subject',
      status: request.status ?? 'Unknown',
      notePreview: request.note?.trim() || 'Chưa có ghi chú bổ sung cho yêu cầu này.',
      pricePerSession: request.pricePerSession ?? 0,
      priceLabel: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(request.pricePerSession ?? 0),
      scheduleSummary: request.preferredSchedule ?? `${request.sessionsPerWeek ?? 0} sessions/week`,
      locationSummary: request.fullAddress ?? 'Location unavailable',
      expiresAt: request.expiresAt
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.expiresAt))
        : 'No expiry',
      createdAt: request.createdAt
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(request.createdAt))
        : 'Unknown',
      applicationCount: request.applicationCount ?? 0
    };
  }
}
