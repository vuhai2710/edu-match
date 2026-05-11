import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { extractHttpErrorMessage } from '../../../../../core/http/http-error.utils';
import { PaymentListItemVm, PaymentsDataService } from '../../data-access/payments-data.service';
import { PagedCollection } from '../../../../../shared/types/paged-collection';

@Component({
  selector: 'app-admin-payments-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-payments-page.component.html',
  styleUrl: './admin-payments-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminPaymentsPageComponent {
  private readonly paymentsData = inject(PaymentsDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly page = signal<PagedCollection<PaymentListItemVm> | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.paymentsData
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
