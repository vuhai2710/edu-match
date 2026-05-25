import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { INITIAL_TUTORS, DETAILED_REVIEWS } from '../../../shared/fixtures/mock-data';

@Component({
  selector: 'app-tutor-profile-page',
  imports: [RouterLink, MascotComponent],
  template: `
    @if (tutor(); as t) {
      <div class="space-y-6">
        <!-- Back -->
        <a routerLink="/student/discover" class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
          ← Quay lại
        </a>

        <div class="grid lg:grid-cols-3 gap-6">
          <!-- Main info -->
          <div class="lg:col-span-2 space-y-6">
            <div class="tactile-card p-6">
              <div class="flex items-center gap-4">
                <img [src]="t.avatar" [alt]="t.name" referrerpolicy="no-referrer"
                     class="w-20 h-20 rounded-full object-cover border-4 border-green-100" />
                <div>
                  <div class="flex items-center gap-2">
                    <h1 class="font-display text-2xl font-black text-slate-900">{{ t.name }}</h1>
                    @if (t.isTop) {
                      <span class="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">⭐ Top Gia sư</span>
                    }
                  </div>
                  <p class="text-slate-500 mt-1">{{ t.location }}</p>
                  <div class="flex items-center gap-3 mt-2">
                    <span class="flex items-center gap-1 text-amber-600 font-bold text-sm">⭐ {{ t.rating }}/5.0</span>
                    <span class="text-slate-400">·</span>
                    <span class="text-sm text-slate-600 font-semibold">{{ t.experienceYears }} năm kinh nghiệm</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- About -->
            <div class="tactile-card p-6">
              <h2 class="font-extrabold text-lg text-slate-900 mb-2">📖 Giới thiệu</h2>
              <p class="text-sm text-slate-600 leading-relaxed">{{ t.bio }}</p>
              <p class="text-sm text-slate-600 leading-relaxed mt-2">{{ t.experience }}</p>
            </div>

            <!-- Subjects -->
            <div class="tactile-card p-6">
              <h2 class="font-extrabold text-lg text-slate-900 mb-3">📚 Môn giảng dạy</h2>
              <div class="flex flex-wrap gap-2">
                @for (s of t.subjects; track s) {
                  <span class="bg-blue-50 text-duo-blue px-3 py-1.5 rounded-xl text-sm font-bold border border-blue-100">
                    {{ s }}
                  </span>
                }
              </div>
            </div>

            <!-- Reviews -->
            <div class="tactile-card p-6">
              <h2 class="font-extrabold text-lg text-slate-900 mb-4">💬 Đánh giá từ học viên</h2>
              <div class="space-y-4">
                @for (rev of reviews; track rev.id) {
                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="flex items-center gap-3 mb-2">
                      <img [src]="rev.avatar" [alt]="rev.name" class="w-9 h-9 rounded-full object-cover" />
                      <div>
                        <p class="font-bold text-sm text-slate-900">{{ rev.name }}</p>
                        <span class="text-xs text-amber-600 font-bold">⭐ {{ rev.rating }}</span>
                      </div>
                    </div>
                    <p class="text-sm text-slate-600">{{ rev.comment }}</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Sidebar: Pricing -->
          <div class="space-y-4">
            <div class="tactile-card p-6 sticky top-20">
              <div class="text-center mb-4">
                <p class="text-sm text-slate-500 font-bold">Học phí / giờ</p>
                <p class="font-display text-3xl font-black text-duo-green mt-1">{{ formatPrice(t.hourlyRate) }}</p>
              </div>
              <a [routerLink]="['/student/booking', t.id]"
                 class="tactile-button-green w-full py-3 rounded-2xl text-base font-extrabold uppercase text-center block">
                📅 Đặt lịch học
              </a>
              <button class="tactile-button-gray w-full py-2.5 rounded-2xl text-sm font-bold mt-2">
                ❤️ Thêm yêu thích
              </button>
              <button class="tactile-button-gray w-full py-2.5 rounded-2xl text-sm font-bold mt-2">
                💬 Nhắn tin
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="text-center py-16">
        <app-mascot type="sadMagnifier" [size]="120" />
        <p class="mt-4 font-extrabold text-slate-700">Không tìm thấy gia sư</p>
      </div>
    }
  `,
})
export class TutorProfilePage {
  private route = inject(ActivatedRoute);
  readonly reviews = DETAILED_REVIEWS;

  readonly tutor = computed(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return INITIAL_TUTORS.find(t => t.id === id) ?? null;
  });

  formatPrice(n: number) {
    return new Intl.NumberFormat('vi-VN').format(n) + 'đ';
  }
}
