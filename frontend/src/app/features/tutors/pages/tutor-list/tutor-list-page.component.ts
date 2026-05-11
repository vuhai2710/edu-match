import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { extractHttpErrorMessage } from '../../../../core/http/http-error.utils';
import { TutorListItemVm, TutorsDataService } from '../../data-access/tutors-data.service';
import { PagedCollection } from '../../../../shared/types/paged-collection';

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
}
