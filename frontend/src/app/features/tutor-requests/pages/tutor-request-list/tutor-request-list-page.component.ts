import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { UserRole } from '../../../../../api/generated';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';
import { TutorRequestListItemVm, TutorRequestsDataService } from '../../data-access/tutor-requests-data.service';
import { PagedCollection } from '../../../../shared/types/paged-collection';

@Component({
  selector: 'app-tutor-request-list-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tutor-request-list-page.component.html',
  styleUrl: './tutor-request-list-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TutorRequestListPageComponent {
  private readonly tutorRequestsData = inject(TutorRequestsDataService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal<PagedCollection<TutorRequestListItemVm> | null>(null);
  protected readonly keyword = signal('');
  protected readonly educationFilter = signal('all');
  protected readonly minPriceFilter = signal('all');
  protected readonly visibleCount = signal(6);
  protected readonly becomeTutorLoading = signal(false);
  protected readonly isAuthenticated = this.authSession.isAuthenticated;

  protected readonly filteredRequests = computed(() => {
    const items = this.page()?.items ?? [];
    const keyword = this.keyword().trim().toLowerCase();
    const educationFilter = this.educationFilter();
    const minPrice = this.minPriceFilter() === 'all' ? 0 : Number(this.minPriceFilter());

    return items.filter((request) => {
      const matchesKeyword =
        !keyword ||
        request.subjectName.toLowerCase().includes(keyword) ||
        request.notePreview.toLowerCase().includes(keyword) ||
        request.locationSummary.toLowerCase().includes(keyword);

      const matchesEducation =
        educationFilter === 'all' || request.educationLevel.toLowerCase().includes(educationFilter.toLowerCase());

      const matchesPrice = request.pricePerSession >= minPrice;

      return matchesKeyword && matchesEducation && matchesPrice;
    });
  });

  protected readonly visibleRequests = computed(() => this.filteredRequests().slice(0, this.visibleCount()));
  protected readonly canLoadMore = computed(() => this.filteredRequests().length > this.visibleCount());

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.tutorRequestsData
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

  protected updateKeyword(value: string): void {
    this.keyword.set(value);
    this.visibleCount.set(6);
  }

  protected updateEducationFilter(value: string): void {
    this.educationFilter.set(value);
    this.visibleCount.set(6);
  }

  protected updateMinPriceFilter(value: string): void {
    this.minPriceFilter.set(value);
    this.visibleCount.set(6);
  }

  protected loadMore(): void {
    this.visibleCount.update((count) => count + 6);
  }

  protected statusLabel(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'Đang mở';
      case 'assigned':
        return 'Đã giao';
      case 'closed':
        return 'Đã đóng';
      case 'expired':
        return 'Hết hạn';
      default:
        return status;
    }
  }

  protected statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'open':
        return 'status-badge status-badge--open';
      case 'assigned':
        return 'status-badge status-badge--assigned';
      case 'closed':
        return 'status-badge status-badge--closed';
      case 'expired':
        return 'status-badge status-badge--expired';
      default:
        return 'status-badge';
    }
  }

  protected requestToneClass(status: string): string {
    return status.toLowerCase() === 'assigned' || status.toLowerCase() === 'closed' ? 'request-card--muted' : '';
  }

  protected timeAgo(value: string | null): string {
    if (!value) {
      return 'Đăng gần đây';
    }

    const createdAt = new Date(value).getTime();
    const diffInHours = Math.max(1, Math.round((Date.now() - createdAt) / (1000 * 60 * 60)));

    if (diffInHours < 24) {
      return `Đăng ${diffInHours} giờ trước`;
    }

    const diffInDays = Math.round(diffInHours / 24);
    return `Đăng ${diffInDays} ngày trước`;
  }

  protected loginToViewDetails(): void {
    void this.router.navigate(['/auth/login'], {
      queryParams: {
        redirect: '/tutor-requests'
      }
    });
  }

  protected registerToTeach(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], {
        queryParams: {
          redirect: '/tutor-requests',
          intent: 'become-tutor'
        }
      });
      return;
    }

    const role = this.authSession.currentUser()?.role;
    if (role === UserRole.Tutor || role === UserRole.Admin) {
      return;
    }

    this.becomeTutorLoading.set(true);
    this.authSession
      .becomeTutor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.becomeTutorLoading.set(false),
        error: (error) => {
          this.becomeTutorLoading.set(false);
          this.errorMessage.set(extractHttpErrorMessage(error));
        }
      });
  }
}
