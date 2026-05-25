import { Component, signal } from '@angular/core';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-tutor-dashboard-page',
  imports: [MascotComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome -->
      <div class="bg-gradient-to-r from-duo-blue to-cyan-500 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <app-mascot type="tutorWand" [size]="100" className="hidden sm:block" />
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Chào Gia sư! 🧙</h1>
          <p class="mt-1 text-blue-100">Hôm nay bạn có 2 lớp cần dạy. Kiểm tra yêu cầu mới nhé!</p>
          <div class="flex items-center gap-3 mt-3">
            <span class="bg-white/20 rounded-full px-3 py-1 text-sm font-black">⭐ 4.9/5.0</span>
            <span class="bg-white/20 rounded-full px-3 py-1 text-sm font-black">📊 32 giờ dạy</span>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid sm:grid-cols-3 gap-4">
        <div class="tactile-card p-5 text-center">
          <p class="text-2xl">💰</p>
          <p class="font-display text-2xl font-black text-duo-green mt-1">2,400,000đ</p>
          <p class="text-xs text-slate-500 font-bold">Thu nhập tháng này</p>
        </div>
        <div class="tactile-card p-5 text-center">
          <p class="text-2xl">⏱️</p>
          <p class="font-display text-2xl font-black text-duo-blue mt-1">32 giờ</p>
          <p class="text-xs text-slate-500 font-bold">Giờ dạy</p>
        </div>
        <div class="tactile-card p-5 text-center">
          <p class="text-2xl">📋</p>
          <p class="font-display text-2xl font-black text-duo-orange mt-1">85%</p>
          <p class="text-xs text-slate-500 font-bold">Hồ sơ hoàn thiện</p>
        </div>
      </div>

      <!-- Pending Request -->
      <div>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">📬 Yêu cầu mới từ học viên</h2>
        @if (!requestHandled()) {
          <div class="tactile-card p-5">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-xl">🎒</div>
              <div class="flex-1">
                <p class="font-extrabold text-slate-900">Trần Anh Dũng</p>
                <p class="text-sm text-slate-500">Toán 12 · 2 buổi/tuần · 250,000đ/h</p>
                <p class="text-xs text-slate-400 mt-1">Gửi 30 phút trước</p>
              </div>
            </div>
            <div class="flex gap-3 mt-4">
              <button (click)="handleRequest('accept')"
                      class="tactile-button-green flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase">
                ✅ Chấp nhận
              </button>
              <button (click)="handleRequest('reject')"
                      class="tactile-button-gray flex-1 py-2.5 rounded-xl text-sm font-bold">
                ❌ Từ chối
              </button>
            </div>
          </div>
        } @else {
          <div class="tactile-card p-5 text-center bg-green-50 border-green-200">
            <p class="text-2xl mb-2">{{ requestAction() === 'accept' ? '🎉' : '📝' }}</p>
            <p class="font-extrabold text-slate-800">
              {{ requestAction() === 'accept' ? 'Đã chấp nhận! Học viên sẽ thanh toán sớm.' : 'Đã từ chối yêu cầu này.' }}
            </p>
          </div>
        }
      </div>

      <!-- Upcoming classes -->
      <div>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">📅 Lớp học sắp tới</h2>
        <div class="space-y-3">
          <div class="tactile-card p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">🟢</div>
              <div>
                <p class="font-bold text-sm text-slate-900">Vật lý lớp 11</p>
                <p class="text-xs text-slate-500">Hôm nay, 19:00 - 20:30</p>
              </div>
            </div>
            <button class="tactile-button-green px-4 py-2 rounded-xl text-xs font-extrabold uppercase">Vào lớp</button>
          </div>
          <div class="tactile-card p-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">📘</div>
              <div>
                <p class="font-bold text-sm text-slate-900">Toán 12 - Tích phân</p>
                <p class="text-xs text-slate-500">Ngày mai, 15:00 - 16:30</p>
              </div>
            </div>
            <span class="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">Sắp tới</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TutorDashboardPage {
  requestHandled = signal(false);
  requestAction = signal<'accept' | 'reject' | ''>('');

  handleRequest(action: 'accept' | 'reject') {
    this.requestAction.set(action);
    this.requestHandled.set(true);
  }
}
