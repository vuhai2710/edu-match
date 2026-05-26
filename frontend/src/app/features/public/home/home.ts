import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MascotComponent],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-slate-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div class="space-y-6">
          <div class="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-extrabold text-xs uppercase tracking-widest">
            <span>🎓</span> Nền tảng gia sư #1 Việt Nam
          </div>
          <h1 class="font-display text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight">
            Tìm gia sư <span class="text-[#58cc02]">hoàn hảo</span> chỉ trong <span class="text-duo-blue">5 phút</span>
          </h1>
          <p class="text-lg text-slate-600 leading-relaxed max-w-lg">
            Kết nối 1-1 với gia sư chất lượng đã được xác minh. Học đúng cách, tiến bộ nhanh, từ trực tiếp đến trực tuyến.
          </p>
          <div class="flex flex-wrap gap-3 pt-2">
            <a routerLink="/auth/register/student"
               class="tactile-button-green px-8 py-3.5 rounded-2xl text-lg font-extrabold uppercase inline-flex items-center gap-2">
              🎒 Tôi là Học viên
            </a>
            <a routerLink="/auth/register/tutor"
               class="tactile-button-blue px-8 py-3.5 rounded-2xl text-lg font-extrabold uppercase inline-flex items-center gap-2">
              🧙 Tôi là Gia sư
            </a>
          </div>
        </div>
        <div class="flex justify-center md:justify-end">
          <app-mascot type="successGraduation" [size]="320" />
        </div>
      </div>
    </section>

    <!-- Benefits -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl md:text-4xl font-black text-slate-900">Bắt đầu dễ dàng như <span class="text-[#58cc02]">1-2-3</span></h2>
        <p class="text-slate-500 mt-3 text-lg">Không cần lo lắng, mọi thứ đều minh bạch & an toàn</p>
      </div>
      <div class="grid sm:grid-cols-3 gap-6">
        @for (card of benefitCards; track card.title) {
          <div class="tactile-card p-6 text-center hover:shadow-lg transition-shadow">
            <div class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4" [class]="card.bgClass">
              {{ card.emoji }}
            </div>
            <h3 class="font-extrabold text-lg text-slate-900">{{ card.title }}</h3>
            <p class="text-sm text-slate-500 mt-2 leading-relaxed">{{ card.desc }}</p>
          </div>
        }
      </div>
    </section>

    <!-- CTA Banner -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <div class="bg-gradient-to-r from-[#58cc02] to-emerald-500 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-lg">
        <app-mascot type="eduLogo" [size]="140" />
        <div class="flex-1 text-center md:text-left">
          <h2 class="font-display text-3xl font-black text-white">Sẵn sàng tỏa sáng? 🌟</h2>
          <p class="text-green-100 mt-2 text-lg">Bắt đầu hành trình học tập thông minh cùng EduMatch ngay hôm nay!</p>
        </div>
        <a routerLink="/auth/register"
           class="bg-white text-[#58cc02] px-8 py-3.5 rounded-2xl font-extrabold text-lg uppercase border-b-4 border-green-200 hover:border-green-300 transition-colors shadow-md">
          Đăng ký miễn phí
        </a>
      </div>
    </section>
  `,
})
export class HomePage {
  readonly benefitCards = [
    { emoji: '🔍', title: 'Tìm gia sư', desc: 'Duyệt hàng ngàn gia sư với đánh giá & hồ sơ chi tiết, lọc theo môn học, vị trí, giá.', bgClass: 'bg-green-100' },
    { emoji: '📅', title: 'Đặt lịch linh hoạt', desc: 'Chọn lịch, số buổi và mục tiêu học tập. Gia sư xác nhận - bạn chỉ cần đợi kết quả!', bgClass: 'bg-blue-100' },
    { emoji: '💸', title: 'Thanh toán an toàn', desc: 'Đặt cọc minh bạch qua PayOS, hoàn tiền nếu gia sư hủy. Yên tâm 100%.', bgClass: 'bg-orange-100' },
  ];
}
