import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { INITIAL_TUTORS } from '../../../shared/fixtures/mock-data';

@Component({
  selector: 'app-create-booking-page',
  imports: [RouterLink],
  template: `
    @if (tutor(); as t) {
      <div class="max-w-2xl mx-auto space-y-6">
        <a routerLink="/student/discover" class="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800">
          ← Quay lại
        </a>

        <div class="text-center">
          <h1 class="font-display text-2xl font-black text-slate-900">📅 Đặt lịch học</h1>
          <p class="text-slate-500 mt-1">Đặt lịch với {{ t.name }}</p>
        </div>

        <!-- Progress -->
        <div class="flex items-center gap-1">
          @for (step of [1,2,3]; track step) {
            <div class="flex-1 h-2 rounded-full" [class]="step <= currentStep() ? 'bg-duo-green' : 'bg-slate-200'"></div>
          }
        </div>

        <div class="tactile-card p-6 space-y-5">
          <!-- Step 1: Sessions -->
          @if (currentStep() === 1) {
            <h2 class="font-extrabold text-lg text-slate-900">Số buổi học</h2>
            <div class="grid grid-cols-4 gap-3">
              @for (n of [1,2,3,4]; track n) {
                <button (click)="sessions.set(n)"
                        [class]="sessions() === n ? 'tactile-button-green' : 'tactile-button-gray'"
                        class="py-3 rounded-xl text-lg font-black">
                  {{ n }}
                </button>
              }
            </div>
          }
          <!-- Step 2: Goal -->
          @if (currentStep() === 2) {
            <h2 class="font-extrabold text-lg text-slate-900">Mục tiêu học tập</h2>
            <textarea [(value)]="goal" rows="4" placeholder="Mô tả mục tiêu, nội dung bạn muốn học..."
                      class="tactile-input w-full text-sm font-semibold resize-none"
                      (input)="goal = $any($event.target).value"></textarea>
          }
          <!-- Step 3: Summary -->
          @if (currentStep() === 3) {
            <h2 class="font-extrabold text-lg text-slate-900">Xác nhận đặt lịch</h2>
            <div class="bg-slate-50 rounded-2xl p-5 space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Gia sư</span>
                <span class="font-bold text-slate-900">{{ t.name }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Số buổi</span>
                <span class="font-bold text-slate-900">{{ sessions() }} buổi</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-slate-500">Đơn giá</span>
                <span class="font-bold text-slate-900">{{ formatPrice(t.hourlyRate) }}/h</span>
              </div>
              <hr class="border-slate-200" />
              <div class="flex justify-between">
                <span class="font-bold text-slate-700">Tổng đặt cọc</span>
                <span class="font-display text-xl font-black text-duo-green">{{ formatPrice(t.hourlyRate * sessions()) }}</span>
              </div>
            </div>
          }

          <!-- Nav buttons -->
          <div class="flex gap-3">
            @if (currentStep() > 1) {
              <button (click)="currentStep.set(currentStep() - 1)" class="tactile-button-gray flex-1 py-3 rounded-xl font-bold">
                ← Quay lại
              </button>
            }
            @if (currentStep() < 3) {
              <button (click)="currentStep.set(currentStep() + 1)" class="tactile-button-blue flex-1 py-3 rounded-xl font-extrabold uppercase">
                Tiếp theo →
              </button>
            }
            @if (currentStep() === 3) {
              <button (click)="onSubmit()" class="tactile-button-green flex-1 py-3 rounded-xl font-extrabold uppercase">
                💳 Thanh toán đặt cọc
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class CreateBookingPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  currentStep = signal(1);
  sessions = signal(1);
  goal = '';

  readonly tutor = computed(() => {
    const id = this.route.snapshot.paramMap.get('tutorId');
    return INITIAL_TUTORS.find(t => t.id === id) ?? INITIAL_TUTORS[0];
  });

  formatPrice(n: number) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }

  onSubmit() {
    this.router.navigateByUrl('/student/booking-success');
  }
}
