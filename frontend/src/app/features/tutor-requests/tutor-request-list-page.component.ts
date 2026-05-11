import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { extractHttpErrorMessage } from '../../core/http/http-error.utils';
import { TutorRequestListItemVm, TutorRequestsDataService } from '../../data-access/tutor-requests-data.service';
import { PagedCollection } from '../../shared/paged-view';

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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal<PagedCollection<TutorRequestListItemVm> | null>(null);

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
}
