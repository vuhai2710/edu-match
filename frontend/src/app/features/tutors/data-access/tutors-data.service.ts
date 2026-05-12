import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { GetTutorsRequestParams, TutorDto, TutorsApi } from '../../../../api/generated';
import { PagedCollection } from '../../../shared/types/paged-collection';
import { unwrapPagedResponse } from '../../../shared/utils/api-response.utils';

export interface TutorListItemVm {
  id: number;
  code: string;
  fullName: string;
  hourlyRate: number;
  hourlyRateLabel: string;
  hourlyRateCompactLabel: string;
  rating: number;
  ratingLabel: string;
  totalReviews: number;
  totalReviewsLabel: string;
  subjectTags: string[];
  subjectSummary: string;
  locationSummary: string;
  profileSummary: string;
  avatarUrl: string | null;
  initials: string;
  isVerified: boolean;
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
    const subjectTags = tutor.subjects?.map((subject) => subject.subjectName?.trim()).filter((subject): subject is string => !!subject) ?? [];
    const locationSummary = [tutor.address?.provinceName, tutor.address?.wardName].filter(Boolean).join(', ') || 'Khu vực linh hoạt';

    return {
      id: tutor.id ?? 0,
      code: tutor.code ?? 'N/A',
      fullName: tutor.fullName ?? 'Gia sư chưa cập nhật tên',
      hourlyRate: tutor.hourlyRate ?? 0,
      hourlyRateLabel: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(tutor.hourlyRate ?? 0),
      hourlyRateCompactLabel: this.formatCompactHourlyRate(tutor.hourlyRate ?? 0),
      rating: tutor.rating ?? 0,
      ratingLabel: (tutor.rating ?? 0).toFixed(1),
      totalReviews: tutor.totalReviews ?? 0,
      totalReviewsLabel: `${tutor.totalReviews ?? 0} đánh giá`,
      subjectTags: subjectTags.slice(0, 3),
      subjectSummary:
        tutor.subjects?.map((subject) => `${subject.subjectName ?? 'Môn học'}${subject.level ? ` (${subject.level})` : ''}`).join(', ') ||
        'Đang cập nhật môn dạy',
      locationSummary,
      profileSummary: this.buildProfileSummary(subjectTags, locationSummary, tutor.rating ?? 0, tutor.totalReviews ?? 0),
      avatarUrl: tutor.avatarUrl ?? null,
      initials: this.buildInitials(tutor.fullName),
      isVerified: (tutor.totalReviews ?? 0) > 0 || (tutor.rating ?? 0) >= 4.5
    };
  }

  private formatCompactHourlyRate(hourlyRate: number): string {
    if (hourlyRate >= 1_000_000) {
      return `${this.trimDecimal(hourlyRate / 1_000_000)}tr`;
    }

    if (hourlyRate >= 1_000) {
      return `${this.trimDecimal(hourlyRate / 1_000)}k`;
    }

    return `${hourlyRate}`;
  }

  private trimDecimal(value: number): string {
    return Number.isInteger(value) ? `${value}` : value.toFixed(1);
  }

  private buildInitials(fullName: string | null | undefined): string {
    const safeName = fullName?.trim();

    if (!safeName) {
      return 'EM';
    }

    return safeName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');
  }

  private buildProfileSummary(subjectTags: string[], locationSummary: string, rating: number, totalReviews: number): string {
    const subjectLabel = subjectTags.length ? subjectTags.slice(0, 2).join(', ') : 'nhiều môn học';
    const baseSummary = `Chuyên dạy ${subjectLabel} tại ${locationSummary.toLowerCase()}.`;

    if (rating > 0 && totalReviews > 0) {
      return `${baseSummary} Được học viên đánh giá ${rating.toFixed(1)}/5 qua ${totalReviews} nhận xét.`;
    }

    return `${baseSummary} Hồ sơ đang được cập nhật thêm về kinh nghiệm giảng dạy.`;
  }
}
