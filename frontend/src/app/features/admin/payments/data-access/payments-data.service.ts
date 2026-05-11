import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { AdminApi, GetAllPaymentsRequestParams, PaymentAdminDto } from '../../../../../api/generated';
import { PagedCollection } from '../../../../shared/types/paged-collection';
import { unwrapPagedResponse } from '../../../../shared/utils/api-response.utils';

export interface PaymentListItemVm {
  id: number;
  orderCode: number;
  tutorId: number;
  classId: number;
  description: string;
  amountLabel: string;
  status: string;
  transactionId: string;
  paidAt: string;
  createdAt: string;
  checkoutUrl: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentsDataService {
  private readonly adminApi = inject(AdminApi);

  list(params: GetAllPaymentsRequestParams = {}): Observable<PagedCollection<PaymentListItemVm>> {
    return this.adminApi
      .getAllPayments({
        page: 1,
        pageSize: 20,
        ...params
      })
      .pipe(
        map((response) => unwrapPagedResponse(response)),
        map((page) => ({
          ...page,
          items: page.items.map((payment) => this.mapPayment(payment))
        }))
      );
  }

  private mapPayment(payment: PaymentAdminDto): PaymentListItemVm {
    return {
      id: payment.id ?? 0,
      orderCode: payment.orderCode ?? 0,
      tutorId: payment.tutorId ?? 0,
      classId: payment.classId ?? 0,
      description: payment.description ?? 'No description',
      amountLabel: new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
      }).format(payment.amount ?? 0),
      status: payment.status ?? 'Unknown',
      transactionId: payment.transactionId ?? 'Pending',
      paidAt: payment.paidAt
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.paidAt))
        : 'Not paid yet',
      createdAt: payment.createdAt
        ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(payment.createdAt))
        : 'Unknown',
      checkoutUrl: payment.checkoutUrl ?? null
    };
  }
}
