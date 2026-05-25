import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { INITIAL_CLASSES } from '../../../shared/fixtures/mock-data';

@Component({
  selector: 'app-student-dashboard-page',
  imports: [RouterLink, MascotComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome Banner -->
      <div class="bg-gradient-to-r from-[#58cc02] to-emerald-500 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <app-mascot type="studentBackpack" [size]="100" className="hidden sm:block" />
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Chào, Học viên! 👋</h1>
          <p class="mt-1 text-green-100 text-sm md:text-base">Hôm nay bạn muốn học gì? Hãy duy trì streak nhé!</p>
          <div class="flex items-center gap-4 mt-3">
            <div class="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <span class="text-lg">🔥</span>
              <span class="text-sm font-black">5 ngày streak</span>
            </div>
            <div class="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <span class="text-lg">⭐</span>
              <span class="text-sm font-black">128 XP</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Cards -->
      <div>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">📋 Hoạt động của bạn</h2>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (cls of classes; track cls.id) {
            <div class="tactile-card p-5 hover:shadow-md transition-shadow">
              <div class="flex items-start justify-between mb-2">
                <h3 class="font-extrabold text-slate-900">{{ cls.title }}</h3>
                <span class="text-xs font-bold px-2 py-0.5 rounded-full"
                      [class]="cls.status === 'online' ? 'bg-green-100 text-green-700'
                             : cls.status === 'pending_payment' ? 'bg-orange-100 text-orange-700'
                             : 'bg-slate-100 text-slate-600'">
                  {{ cls.status === 'online' ? '🟢 Đang diễn ra'
                   : cls.status === 'pending_payment' ? '💳 Chờ thanh toán'
                   : '⏳ Chờ xác nhận' }}
                </span>
              </div>
              <p class="text-sm text-slate-500">Gia sư: {{ cls.tutorName }}</p>
              <p class="text-xs text-slate-400 mt-1">{{ cls.timeString }}</p>
              @if (cls.status === 'online') {
                <button class="tactile-button-green w-full mt-3 py-2 rounded-xl text-sm font-extrabold uppercase">
                  🎥 Vào học ngay
                </button>
              }
              @if (cls.status === 'pending_payment') {
                <button class="tactile-button-orange w-full mt-3 py-2 rounded-xl text-sm font-extrabold uppercase">
                  💳 Thanh toán đặt cọc
                </button>
              }
            </div>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid sm:grid-cols-2 gap-4">
        <a routerLink="/student/discover" class="tactile-card p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl">🔍</div>
          <div>
            <h3 class="font-extrabold text-slate-900 group-hover:text-duo-blue transition-colors">Tìm gia sư mới</h3>
            <p class="text-sm text-slate-500">Duyệt hồ sơ gia sư chất lượng</p>
          </div>
        </a>
        <div class="tactile-card p-5 flex items-center gap-4">
          <div class="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-2xl">🏆</div>
          <div>
            <h3 class="font-extrabold text-slate-900">Thành tích</h3>
            <p class="text-sm text-slate-500">2 lớp hoàn thành, 8 giờ học</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StudentDashboardPage {
  readonly classes = INITIAL_CLASSES;
}
