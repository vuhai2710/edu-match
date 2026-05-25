import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-admin-dashboard-page',
  imports: [FormsModule, MascotComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome -->
      <div class="bg-gradient-to-r from-slate-800 to-slate-900 rounded-3xl p-6 md:p-8 flex items-center gap-6 shadow-lg">
        <app-mascot type="adminBlueGlasses" [size]="90" className="hidden sm:block" />
        <div class="flex-1 text-white">
          <h1 class="font-display text-2xl md:text-3xl font-black">Bảng điều khiển Admin 🛡️</h1>
          <p class="mt-1 text-slate-400">Quản lý hệ thống EduMatch, xử lý hoàn tiền & kiểm duyệt.</p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid sm:grid-cols-4 gap-4">
        @for (stat of stats; track stat.label) {
          <div class="tactile-card p-5 text-center">
            <p class="text-2xl">{{ stat.emoji }}</p>
            <p class="font-display text-2xl font-black mt-1" [class]="stat.color">{{ stat.value }}</p>
            <p class="text-xs text-slate-500 font-bold">{{ stat.label }}</p>
          </div>
        }
      </div>

      <!-- Refund Management -->
      <div>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">💳 Yêu cầu hoàn tiền</h2>
        <div class="tactile-card p-5">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-xl">🔴</div>
            <div class="flex-1">
              <p class="font-extrabold text-slate-900">Phạm Quỳnh Vy yêu cầu hoàn tiền</p>
              <p class="text-sm text-slate-500">Lớp Tiếng Anh Giao tiếp · Gia sư hủy trước 12h</p>
              <p class="text-xs text-slate-400 mt-1">Số tiền: 250,000đ · Gửi 2 giờ trước</p>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="tactile-button-green flex-1 py-2.5 rounded-xl text-sm font-extrabold uppercase">
              ✅ Duyệt hoàn tiền
            </button>
            <button class="tactile-button-gray flex-1 py-2.5 rounded-xl text-sm font-bold">
              ❌ Từ chối
            </button>
          </div>
        </div>
      </div>

      <!-- Task Checklist -->
      <div>
        <h2 class="font-extrabold text-lg text-slate-800 mb-3">📝 Nhiệm vụ hôm nay</h2>
        <div class="tactile-card p-5 space-y-3">
          @for (task of tasks; track task.label) {
            <label class="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" [(ngModel)]="task.done" class="w-5 h-5 rounded accent-[#58cc02]" />
              <span class="text-sm font-semibold" [class]="task.done ? 'text-slate-400 line-through' : 'text-slate-700'">
                {{ task.label }}
              </span>
            </label>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminDashboardPage {
  readonly stats = [
    { emoji: '👥', value: '1,245', label: 'Tổng người dùng', color: 'text-duo-blue' },
    { emoji: '🧑‍🏫', value: '156', label: 'Gia sư', color: 'text-duo-green' },
    { emoji: '📚', value: '89', label: 'Lớp đang hoạt động', color: 'text-duo-orange' },
    { emoji: '💰', value: '12.5M', label: 'Doanh thu tháng', color: 'text-duo-purple' },
  ];

  tasks = [
    { label: 'Kiểm duyệt 3 hồ sơ gia sư mới', done: false },
    { label: 'Xử lý 2 yêu cầu hoàn tiền', done: false },
    { label: 'Cập nhật chính sách thanh toán', done: true },
    { label: 'Review báo cáo doanh thu tuần', done: false },
  ];
}
