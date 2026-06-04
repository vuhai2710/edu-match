import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { StudentDetailDto } from '../../api/generated/client/models';
import { StudentsService } from '../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../core/http/api-error';
import { genderLabel, gradeLabel } from '../utils/api-ui';

@Component({
  selector: 'app-student-detail-modal',
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
         (click)="close.emit()">
      <div class="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
           (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="relative px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 class="font-display font-black text-xl text-slate-800">Chi tiết học viên</h3>
          <button (click)="close.emit()" 
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-6 space-y-6 max-h-[75vh] overflow-y-auto">
          @if (isLoading()) {
            <div class="py-12 text-center text-slate-500 font-bold">
              <div class="animate-bounce mb-3 text-2xl">⚡</div>
              Đang tải thông tin học viên...
            </div>
          } @else if (errorMessage()) {
            <div class="p-4 rounded-2xl border-2 border-red-100 bg-red-50 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </div>
          } @else if (student(); as s) {
            <!-- Student Header Profile Info -->
            <div class="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div class="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                @if (s.avatarUrl) {
                  <img [src]="s.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                } @else {
                  <svg class="w-9 h-9 text-[#58cc02]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                }
              </div>
              <div>
                <h4 class="font-display font-black text-lg text-slate-900 leading-tight">{{ s.fullName }}</h4>
                <p class="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">Mã học viên: {{ s.code || 'Đang cập nhật' }}</p>
              </div>
            </div>

            <!-- Profile Fields -->
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Giới tính</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ getGender(s.gender) }}</p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Năm sinh / Tuổi</p>
                <p class="mt-1 font-extrabold text-slate-800">
                  @if (s.birth) {
                    {{ s.birth }} ({{ getAge(s.birth) }} tuổi)
                  } @else {
                    Chưa cập nhật
                  }
                </p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Trình độ / Lớp</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ getGrade(s.gradeLevel) }}</p>
              </div>

              <div class="col-span-2 sm:col-span-1 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Trường học</p>
                <p class="mt-1 font-extrabold text-slate-800">{{ s.school || 'Chưa cập nhật' }}</p>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50 space-y-3">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider border-b border-slate-200/50 pb-1">Thông tin liên hệ</p>
                <div class="grid gap-2">
                  <div class="flex items-center gap-2 text-slate-600">
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span class="font-semibold break-all">{{ s.email || 'Chưa cập nhật' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-slate-600">
                    <svg class="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span class="font-semibold">{{ s.phoneNumber || 'Chưa cập nhật' }}</span>
                  </div>
                </div>
              </div>

              <div class="col-span-2 rounded-2xl bg-slate-50 p-4 border border-slate-100/50">
                <p class="font-bold text-slate-400 text-xs uppercase tracking-wider">Địa chỉ</p>
                <p class="mt-1 font-extrabold text-slate-800">
                  @if (s.address) {
                    {{ s.address.addressDetail ? s.address.addressDetail + ', ' : '' }}
                    {{ s.address.wardName ? s.address.wardName + ', ' : '' }}
                    {{ s.address.provinceName }}
                  } @else {
                    Chưa cập nhật
                  }
                </p>
              </div>
            </div>
          }
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-slate-50 border-t-2 border-slate-100 flex justify-end">
          <button (click)="close.emit()" 
                  class="tactile-button-gray px-5 py-2.5 rounded-xl text-sm font-bold">
            Đóng
          </button>
        </div>
      </div>
    </div>
  `,
})
export class StudentDetailModalComponent implements OnInit {
  userId = input<number | null | undefined>(null);
  close = output<void>();

  student = signal<StudentDetailDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  private readonly studentsApi = inject(StudentsService);

  ngOnInit(): void {
    void this.loadStudentProfile();
  }

  getGender(g?: any): string {
    return genderLabel(g);
  }

  getGrade(g?: any): string {
    return gradeLabel(g);
  }

  getAge(birthYear?: number | null): number {
    if (!birthYear) return 0;
    return new Date().getFullYear() - birthYear;
  }

  private async loadStudentProfile(): Promise<void> {
    const id = this.userId();
    if (!id) {
      this.errorMessage.set('ID người dùng không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.studentsApi.getStudentByUserId(id));
      this.student.set(unwrapApiData(response));
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được thông tin học viên.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
