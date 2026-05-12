import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';
import { TutorListItemVm, TutorsDataService } from '../../data-access/tutors-data.service';
import { PagedCollection } from '../../../../shared/types/paged-collection';

const FALLBACK_TUTORS: TutorListItemVm[] = [
  {
    id: 1001,
    code: 'EM-001',
    fullName: 'Nguyễn Thu Hà',
    hourlyRate: 250000,
    hourlyRateLabel: '250.000 ₫',
    hourlyRateCompactLabel: '250k',
    rating: 4.9,
    ratingLabel: '4.9',
    totalReviews: 12,
    totalReviewsLabel: '12 đánh giá',
    subjectTags: ['Tiếng Anh IELTS', 'Ngữ pháp'],
    subjectSummary: 'Tiếng Anh IELTS, Ngữ pháp',
    locationSummary: 'Đại học Sư phạm Hà Nội',
    profileSummary:
      'Giáo viên chuyên luyện thi IELTS với 5 năm kinh nghiệm. Phương pháp giảng dạy tập trung vào thực hành và rèn luyện tư duy logic.',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDMVhZWFHpIBMISAsUkznZgtmftRDCtvC9I5AZGRS93-c4clg0bV_CbGV9CFKNsIZhHiZzn6UVDyXQigez9cuwEs2yR7T3t2PR2u-YQjJQrbGkZeeVajEVovKv8s7f0H3s_jjJm5rmXdb9WqU9aOH4Mm-hJM692jKwQer8-KJIbce4CjuNvmfMo5g5AoWedkoYNF6Z7hiq2DZoT9vGkHDzeSOO_FGvQXwCaJ5XJwEj5THBBRCaXtHaa4b3jKOYi8NriSa7Kv-wMC98',
    initials: 'NH',
    isVerified: true
  },
  {
    id: 1002,
    code: 'EM-002',
    fullName: 'Trần Tuấn Anh',
    hourlyRate: 300000,
    hourlyRateLabel: '300.000 ₫',
    hourlyRateCompactLabel: '300k',
    rating: 4.8,
    ratingLabel: '4.8',
    totalReviews: 9,
    totalReviewsLabel: '9 đánh giá',
    subjectTags: ['Toán học', 'Vật lý'],
    subjectSummary: 'Toán học, Vật lý',
    locationSummary: 'Đại học Bách Khoa',
    profileSummary:
      'Thạc sĩ Toán học, chuyên dạy kèm các môn khối tự nhiên cho học sinh cấp 3 và luyện thi đại học. Giải thích cặn kẽ, dễ hiểu.',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAiczSZuQMTRN6BE7-UV2howddD6V2wArYEutKD5Cqji2-PFZAf0LeXl8LDM1XD2A2telYtCBTktW5gs2Zw99RNVP-wsBj9_cEgjz2YHIhZFeYgAeW0JEbjwdQaL8Vs0f6g_trpGV_USaPJRsIfXffIr-SvgT-SqelBRM_o1T9AXtw8VFKwjJRqf1rb8jqgFcLJFWAZou7kUkutWyw8bCdQp2S43w7IyHf1EyFv0evWubKdG74bjg-znkBsmjDF3K46TRyZRVg_XmA',
    initials: 'TA',
    isVerified: true
  },
  {
    id: 1003,
    code: 'EM-003',
    fullName: 'Lê Hoàng My',
    hourlyRate: 150000,
    hourlyRateLabel: '150.000 ₫',
    hourlyRateCompactLabel: '150k',
    rating: 5,
    ratingLabel: '5.0',
    totalReviews: 6,
    totalReviewsLabel: '6 đánh giá',
    subjectTags: ['Hóa học', 'Sinh học'],
    subjectSummary: 'Hóa học, Sinh học',
    locationSummary: 'Đại học Khoa học Tự nhiên',
    profileSummary:
      'Sinh viên năm cuối xuất sắc, đạt nhiều giải thưởng quốc gia về Hóa học. Tận tâm, kiên nhẫn và luôn có những bài giảng trực quan sinh động.',
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBJqo63cZsJhxI9Eng21WTegQumHnfJZykkgSgmTf1q0ZpLR4EcRQWDkmruYjM-PcIRFA2-lLNdtqibJdJAI2pYGNAYs-d4OJ7eEub8GH_gei_rRsKFa6rTXX8QLH_tPyWnUtdfTVoZFv7nvvZu8JvUG-B4HeEMwZqrPzyDFdchd1_lEzw04VW0p2Ub5ApnoMbJ8wBR1_E5K7zNn10ZumGNdsBoBS6Pb2eforYboqbRdkAgA3Bj8yefdcCz-NDuZIvrT1Iy_f-lWeM',
    initials: 'LM',
    isVerified: false
  }
];

@Component({
  selector: 'app-tutor-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutor-list-page.component.html',
  styleUrl: './tutor-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorListPageComponent {
  private readonly tutorsData = inject(TutorsDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal<PagedCollection<TutorListItemVm> | null>(null);
  protected readonly searchTerm = signal('');
  protected readonly featuredOnly = signal(false);
  protected readonly skeletonCards = [1, 2, 3];
  protected readonly tutors = computed(() => {
    const liveTutors = this.page()?.items ?? [];
    return liveTutors.length ? liveTutors : FALLBACK_TUTORS;
  });
  protected readonly showingFallback = computed(() => !this.loading() && !(this.page()?.items?.length));
  protected readonly filteredTutors = computed(() => {
    const normalizedQuery = this.normalizeSearch(this.searchTerm());

    return this.tutors().filter((tutor) => {
      const matchesFeatured = !this.featuredOnly() || tutor.rating >= 4.5;
      const searchable = this.normalizeSearch(
        [tutor.fullName, tutor.subjectSummary, tutor.locationSummary, tutor.code, tutor.profileSummary].join(' ')
      );
      const matchesQuery = !normalizedQuery || searchable.includes(normalizedQuery);

      return matchesFeatured && matchesQuery;
    });
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.tutorsData
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.page.set(page);
          this.loading.set(false);
        },
        error: (error) => {
          this.errorMessage.set(extractHttpErrorMessage(error));
          this.loading.set(false);
        }
      });
  }

  protected updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  protected toggleFeaturedOnly(): void {
    this.featuredOnly.update((value) => !value);
  }

  protected clearFilters(): void {
    this.searchTerm.set('');
    this.featuredOnly.set(false);
  }

  private normalizeSearch(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
