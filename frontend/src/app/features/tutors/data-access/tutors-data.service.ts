import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { GetTutorsRequestParams, TutorDto, TutorsApi } from '../../../../api/generated';
import { PagedCollection } from '../../../shared/types/paged-collection';
import { unwrapPagedResponse } from '../../../shared/utils/api-response.utils';

export interface TutorListItemVm {
  id: number;
  code: string;
  fullName: string;
  hourlyRateLabel: string;
  ratingLabel: string;
  totalReviewsLabel: string;
  subjectSummary: string;
  locationSummary: string;
  avatarUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class TutorsDataService {
  private readonly tutorsApi = inject(TutorsApi);

  list(params: GetTutorsRequestParams = {}): Observable<PagedCollection<TutorListItemVm>> {
    return this.tutorsApi
      .getTutors({
        page: 1,
        pageSize: 12,
        ...params
      })
      .pipe(
        map((response) => unwrapPagedResponse(response)),
        map((page) => ({
          ...page,
          items: page.items.map((tutor) => this.mapTutor(tutor))
        }))
      );
  }

  private mapTutor(tutor: TutorDto): TutorListItemVm {
    return {
      id: tutor.id ?? 0,
      code: tutor.code ?? 'N/A',
      fullName: tutor.fullName ?? 'Unnamed tutor',
      hourlyRateLabel: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(tutor.hourlyRate ?? 0),
      ratingLabel: (tutor.rating ?? 0).toFixed(1),
      totalReviewsLabel: `${tutor.totalReviews ?? 0} reviews`,
      subjectSummary:
        tutor.subjects?.map((subject) => `${subject.subjectName ?? 'Unknown'}${subject.level ? ` (${subject.level})` : ''}`).join(', ') ||
        'No subjects attached',
      locationSummary:
        [tutor.address?.provinceName, tutor.address?.wardName].filter(Boolean).join(' • ') || 'Location unavailable',
      avatarUrl: tutor.avatarUrl ?? null
    };
  }
}
