import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-booking-success-page',
  imports: [RouterLink, MascotComponent],
  template: `
    <div class="max-w-md mx-auto text-center py-12 space-y-6">
      <app-mascot type="successGraduation" [size]="160" />
      <h1 class="font-display text-3xl font-black text-slate-900">Yêu cầu đã được gửi</h1>
      <p class="text-slate-500 text-lg">
        Gia sư sẽ phản hồi lịch học. Bạn chỉ thanh toán cọc sau khi yêu cầu chuyển sang trạng thái đã giữ chỗ.
      </p>

      <div class="tactile-card p-5 text-left space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Trạng thái</span>
          <span class="font-bold text-duo-blue">Chờ gia sư phản hồi</span>
        </div>
        <div class="flex justify-between text-sm">
          <span class="text-slate-500">Bước tiếp theo</span>
          <span class="font-bold text-slate-900">Theo dõi yêu cầu học</span>
        </div>
      </div>

      <div class="flex flex-col gap-3">
        <a routerLink="/student/learning-requests" class="tactile-button-green py-3 rounded-2xl font-extrabold uppercase text-center">
          Xem yêu cầu của tôi
        </a>
        <a routerLink="/student/discover" class="tactile-button-gray py-2.5 rounded-2xl font-bold text-center">
          Tìm gia sư khác
        </a>
      </div>
    </div>
  `,
})
export class BookingSuccessPage {}
