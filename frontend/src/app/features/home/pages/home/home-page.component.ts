import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { TutorsDataService } from '../../../tutors/data-access/tutors-data.service';
import { UserRole } from '../../../../../api/generated';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomePageComponent {
  private readonly tutorsData = inject(TutorsDataService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private readonly tutorCount = signal<number | null>(null);
  private readonly tutorRatings = signal<number[]>([]);

  protected readonly isAuthenticated = this.authSession.isAuthenticated;
  protected readonly becomeTutorLoading = signal(false);
  protected readonly successRateLabel = '98%';
  protected readonly averageRatingLabel = computed(() => {
    const ratings = this.tutorRatings();

    if (!ratings.length) {
      return '4.9/5';
    }

    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return `${average.toFixed(1)}/5`;
  });
  protected readonly activeTutorsLabel = computed(() => {
    const total = this.tutorCount();

    if (!total || total <= 0) {
      return '5,000+';
    }

    return `${new Intl.NumberFormat('en-US').format(total)}+`;
  });

  constructor() {
    this.tutorsData
      .list({ pageSize: 12 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          this.tutorCount.set(page.totalCount || page.items.length);
          this.tutorRatings.set(page.items.map((item) => item.rating).filter((rating) => rating > 0));
        },
        error: () => {
          this.tutorCount.set(null);
          this.tutorRatings.set([]);
        }
      });
  }

  protected navigateToTutorDirectory(): void {
    void this.router.navigateByUrl('/tutors');
  }

  protected becomeTutor(): void {
    if (!this.isAuthenticated()) {
      void this.router.navigate(['/auth/login'], {
        queryParams: {
          redirect: '/',
          intent: 'become-tutor'
        }
      });
      return;
    }

    const role = this.authSession.currentUser()?.role;
    if (role === UserRole.Tutor || role === UserRole.Admin) {
      void this.router.navigateByUrl('/tutor-requests');
      return;
    }

    this.becomeTutorLoading.set(true);

    this.authSession
      .becomeTutor()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.becomeTutorLoading.set(false);
          void this.router.navigateByUrl('/tutor-requests');
        },
        error: () => {
          this.becomeTutorLoading.set(false);
        }
      });
  }
}
