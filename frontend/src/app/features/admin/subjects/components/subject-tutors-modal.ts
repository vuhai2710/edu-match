import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { TutorCardDto } from '../../../../api/generated/client/models';
import { SubjectsService } from '../../../../api/generated/client/services';
import { getApiErrorMessage, unwrapApiData } from '../../../../core/http/api-error';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination';
import { TutorDetailModalComponent } from '../../../../shared/components/tutor-detail-modal';
import { formatMoney } from '../../../../shared/utils/api-ui';

@Component({
  selector: 'app-subject-tutors-modal',
  standalone: true,
  imports: [PaginationComponent, TutorDetailModalComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
         (click)="close.emit()">
      <div class="bg-white rounded-3xl border-2 border-slate-100 shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]"
           (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="relative px-6 py-5 border-b-2 border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div>
            <h3 class="font-display font-black text-xl text-slate-800">Danh sách gia sư</h3>
            <p class="text-sm font-bold text-slate-500 mt-1">Môn học: <span class="text-duo-blue">{{ subjectName() }}</span></p>
          </div>
          <button (click)="close.emit()" 
                  class="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="px-6 py-4 flex-1 overflow-y-auto">
          @if (isLoading()) {
            <div class="py-12 text-center text-slate-500 font-bold">
              <div class="animate-bounce mb-3 text-2xl">⚡</div>
              Đang tải danh sách gia sư...
            </div>
          } @else if (errorMessage()) {
            <div class="p-4 rounded-2xl border-2 border-red-100 bg-red-50 text-sm font-bold text-duo-red">
              {{ errorMessage() }}
            </div>
          } @else if (tutors().length === 0) {
            <div class="py-12 text-center text-slate-500">
              <p class="font-extrabold text-lg text-slate-800">Không có gia sư nào</p>
              <p class="text-sm mt-1">Hiện chưa có gia sư nào đăng ký giảng dạy môn học này.</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (t of tutors(); track t.tutorId) {
                <div class="tactile-card p-4 hover:shadow-md transition-shadow cursor-pointer border-2 border-slate-100 hover:border-duo-blue bg-white flex flex-col h-full"
                     (click)="selectedTutorId.set(t.tutorId)">
                  <div class="flex items-start gap-4">
                    <div class="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                      @if (t.avatarUrl) {
                        <img [src]="t.avatarUrl" alt="Avatar" class="w-full h-full object-cover" />
                      } @else {
                        <svg class="w-8 h-8 text-duo-green" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="8" r="4" />
                          <path d="M5 20a7 7 0 0 1 14 0" />
                        </svg>
                      }
                    </div>
                    <div class="flex-1">
                      <h4 class="font-bold text-slate-900 leading-tight truncate">{{ t.fullName }}</h4>
                      <p class="text-xs text-slate-500 mt-0.5 truncate">{{ t.major || 'Chưa cập nhật chuyên ngành' }}</p>
                      
                      <div class="flex items-center gap-3 mt-2 text-xs font-bold">
                        @if (t.rating) {
                          <div class="flex items-center gap-1 text-amber-500">
                            <span>★</span>
                            <span>{{ t.rating.toFixed(1) }}</span>
                            <span class="text-slate-400">({{ t.totalReviews || 0 }})</span>
                          </div>
                        }
                        <div class="text-duo-green">
                          {{ money(t.hourlyRate) }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (!isLoading() && tutors().length > 0) {
          <div class="px-6 pb-2 shrink-0 border-t border-slate-100">
            <app-pagination
              [page]="page()"
              [pageSize]="pageSize()"
              [totalCount]="totalCount()"
              itemsName="gia sư"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            />
          </div>
        }
      </div>
    </div>

    @if (selectedTutorId()) {
      <app-tutor-detail-modal
        [tutorId]="selectedTutorId()"
        (close)="selectedTutorId.set(null)"
      />
    }
  `
})
export class SubjectTutorsModalComponent implements OnInit {
  subjectId = input.required<number>();
  subjectName = input.required<string>();
  close = output<void>();

  tutors = signal<TutorCardDto[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');

  // Pagination
  page = signal(1);
  pageSize = signal(10);
  totalCount = signal(0);

  // Detail Modal
  selectedTutorId = signal<number | null | undefined>(null);

  private readonly subjectsApi = inject(SubjectsService);

  ngOnInit(): void {
    void this.loadTutors();
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  onPageChange(newPage: number): void {
    this.page.set(newPage);
    void this.loadTutors();
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize.set(newSize);
    this.page.set(1);
    void this.loadTutors();
  }

  private async loadTutors(): Promise<void> {
    const id = this.subjectId();
    if (!id) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.subjectsApi.getTutorsBySubject(
          id,
          undefined, // provinceId
          undefined, // wardCode
          undefined, // minRating
          undefined, // maxHourlyRate
          this.page(),
          this.pageSize()
        )
      );
      
      const data = unwrapApiData(response);
      this.tutors.set(data?.items || []);
      this.totalCount.set(data?.totalCount || 0);
    } catch (error) {
      console.error('[SubjectTutorsModal] load failed', error);
      this.errorMessage.set(getApiErrorMessage(error, 'Không thể tải danh sách gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }
}
