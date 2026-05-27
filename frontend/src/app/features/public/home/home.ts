import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import {
  ProvinceDto,
  SubjectListItemDto,
  TutorDto,
  WardDto,
} from '../../../api/generated/client/models';
import {
  AddressService,
  SubjectsService,
  TutorsService,
} from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatMoney } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, MascotComponent, FormsModule, PaginationComponent],
  template: `
    <!-- Hero -->
    <section class="relative overflow-hidden bg-gradient-to-b from-green-50 via-white to-slate-50">
      <div
        class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center"
      >
        <div class="space-y-6">
          <div
            class="inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full font-extrabold text-xs uppercase tracking-widest"
          >
            <span>🎓</span> Nền tảng kết nối học viên và gia sư
          </div>
          <h1
            class="font-display text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-tight"
          >
            Tìm gia sư <span class="text-[#58cc02]">hoàn hảo</span> chỉ trong
            <span class="text-duo-blue">5 phút</span>
          </h1>
          <p class="text-lg text-slate-600 leading-relaxed max-w-lg">
            Kết nối 1-1 với gia sư chất lượng đã được xác minh. Học đúng cách, tiến bộ nhanh, từ
            trực tiếp đến trực tuyến.
          </p>
          <div class="flex flex-wrap gap-3 pt-2">
            <a
              routerLink="/auth/register/student"
              class="tactile-button-green px-8 py-3.5 rounded-2xl text-lg font-extrabold uppercase inline-flex items-center gap-2"
            >
              Tôi là Học viên
            </a>
            <a
              routerLink="/auth/register/tutor"
              class="tactile-button-blue px-8 py-3.5 rounded-2xl text-lg font-extrabold uppercase inline-flex items-center gap-2"
            >
              Tôi là Gia sư
            </a>
          </div>
        </div>
        <div class="flex justify-center md:justify-end">
          <app-mascot type="successGraduation" [size]="320" />
        </div>
      </div>
    </section>

    <!-- Discover Tutors Section -->
    <section class="bg-slate-50 border-y border-slate-200 py-16">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        <div class="text-center max-w-xl mx-auto">
          <h2 class="font-display text-3xl md:text-4xl font-black text-slate-900">
            Khám phá <span class="text-duo-blue">Gia sư</span>
          </h2>
          <p class="text-slate-500 mt-2 text-base">
            Tìm gia sư và môn học phù hợp nhất để đạt kết quả xuất sắc
          </p>
        </div>

        <div class="space-y-3">
          <div class="grid lg:grid-cols-[1fr_auto] gap-3">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keydown.enter)="triggerSearch()"
              placeholder="Tìm theo tên, môn học, chuyên ngành..."
              class="tactile-input w-full text-sm font-semibold"
            />
            <button
              (click)="triggerSearch()"
              class="tactile-button-blue px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase"
            >
              Tìm kiếm
            </button>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select
              [ngModel]="activeSubjectId()"
              (ngModelChange)="setSubject($event)"
              class="tactile-input w-full text-sm font-semibold bg-white"
            >
              <option [ngValue]="null">Tất cả môn học</option>
              @for (subject of subjects(); track subject.id) {
                <option [ngValue]="subject.id">{{ subject.name }}</option>
              }
            </select>

            <select
              [ngModel]="provinceId()"
              (ngModelChange)="onProvinceChange($event)"
              class="tactile-input w-full text-sm font-semibold bg-white"
            >
              <option [ngValue]="null">Tất cả tỉnh / thành</option>
              @for (province of provinces(); track province.provinceId) {
                <option [ngValue]="province.provinceId">{{ province.provinceName }}</option>
              }
            </select>

            <select
              [ngModel]="wardCode()"
              (ngModelChange)="setWard($event)"
              class="tactile-input w-full text-sm font-semibold bg-white"
              [disabled]="!provinceId() || isLoadingWards()"
            >
              <option [ngValue]="null">Tất cả phường / xã</option>
              @for (ward of wards(); track ward.wardCode) {
                <option [ngValue]="ward.wardCode">{{ ward.wardName }}</option>
              }
            </select>
          </div>
        </div>

        @if (errorMessage()) {
          <p
            class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
          >
            {{ errorMessage() }}
          </p>
        }

        @if (isLoading() && tutors().length === 0) {
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of [1, 2, 3, 4, 5, 6]; track item) {
              <div class="tactile-card p-5 animate-pulse">
                <div class="h-14 bg-slate-100 rounded-xl"></div>
                <div class="h-4 bg-slate-100 rounded mt-4"></div>
                <div class="h-4 bg-slate-100 rounded mt-2 w-2/3"></div>
              </div>
            }
          </div>
        } @else if (tutors().length > 0) {
          <div class="space-y-6 relative transition-opacity duration-200" [class.opacity-50]="isLoading()" [class.pointer-events-none]="isLoading()">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              @for (tutor of tutors(); track tutor.id) {
                <a
                  [routerLink]="getTutorLink(tutor.id)"
                  class="tactile-card p-5 hover:shadow-lg transition-all group"
                >
                  <div class="flex items-center gap-3 mb-3">
                    @if (tutor.avatarUrl) {
                      <img
                        [src]="tutor.avatarUrl"
                        [alt]="tutor.fullName"
                        referrerpolicy="no-referrer"
                        class="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
                      />
                    } @else {
                      <div
                        class="w-14 h-14 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-lg border-b-4 border-duo-blue-dark"
                      >
                        {{ initials(tutor.fullName) }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <h3
                        class="font-extrabold text-slate-900 truncate group-hover:text-duo-blue transition-colors"
                      >
                        {{ tutor.fullName }}
                      </h3>
                      <p class="text-sm text-slate-500 truncate">{{ subjectNames(tutor) }}</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-sm">
                    @if (tutor.rating && tutor.rating > 0) {
                      <span class="flex items-center gap-1 text-slate-600 font-bold">
                        {{ tutor.rating }} <span class="text-amber-500">★</span>
                      </span>
                    } @else {
                      <span class="text-xs text-slate-400 font-bold italic">
                        Chưa có đánh giá từ học viên
                      </span>
                    }
                    <span class="font-extrabold text-duo-green"
                      >{{ formatPrice(tutor.hourlyRate) }}/h</span
                    >
                  </div>
                  <p class="text-xs text-slate-400 mt-2 line-clamp-2">
                    @if (tutor.major) {
                      Chuyên ngành: {{ tutor.major }}
                    } @else {
                      {{ tutor.school || tutor.address?.fullAddress || 'Gia sư EduMatch' }}
                    }
                  </p>
                </a>
              }
            </div>

            <!-- Custom Tactile Pagination widget -->
            <app-pagination
              [page]="page()"
              [pageSize]="pageSize()"
              [totalCount]="totalCount()"
              itemsName="gia sư"
              (pageChange)="onPageChange($event)"
              (pageSizeChange)="onPageSizeChange($event)"
            />
          </div>
        } @else {
          <div class="text-center py-12">
            <app-mascot type="sadMagnifier" [size]="120" />
            <p class="mt-4 font-extrabold text-slate-700">Không tìm thấy gia sư nào</p>
            <p class="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        }
      </div>
    </section>

    <!-- Benefits -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
      <div class="text-center mb-12">
        <h2 class="font-display text-3xl md:text-4xl font-black text-slate-900">
          Bắt đầu dễ dàng như <span class="text-[#58cc02]">1-2-3</span>
        </h2>
        <p class="text-slate-500 mt-3 text-lg">
          Không cần lo lắng, mọi thứ đều minh bạch & an toàn
        </p>
      </div>
      <div class="grid sm:grid-cols-3 gap-6">
        @for (card of benefitCards; track card.title) {
          <div class="tactile-card p-6 text-center hover:shadow-lg transition-shadow">
            <div
              class="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl mb-4"
              [class]="card.bgClass"
            >
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
      <div
        class="bg-gradient-to-r from-[#58cc02] to-emerald-500 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 shadow-lg"
      >
        <div class="flex-1 text-center md:text-left">
          <h2 class="font-display text-3xl font-black text-white">Sẵn sàng tỏa sáng?</h2>
          <p class="text-green-100 mt-2 text-lg">
            Bắt đầu hành trình học tập cùng EduMatch ngay hôm nay!
          </p>
        </div>
        <a
          routerLink="/auth/register"
          class="bg-white text-[#58cc02] px-8 py-3.5 rounded-2xl font-extrabold text-lg uppercase border-b-4 border-green-200 hover:border-green-300 transition-colors shadow-md"
        >
          Bắt đầu ngay
        </a>
      </div>
    </section>
  `,
})
export class HomePage implements OnInit {
  // Discover tutor data and filters
  searchQuery = '';
  tutors = signal<TutorDto[]>([]);
  subjects = signal<SubjectListItemDto[]>([]);
  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  activeSubjectId = signal<number | null>(null);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  isLoading = signal(false);
  isLoadingWards = signal(false);
  errorMessage = signal('');

  // Pagination states
  page = signal(1);
  pageSize = signal(5);
  totalCount = signal(0);

  private readonly session = inject(SessionService);
  private readonly tutorsApi = inject(TutorsService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly addressApi = inject(AddressService);

  readonly benefitCards = [
    {
      emoji: '🔍',
      title: 'Tìm gia sư',
      desc: 'Duyệt hàng ngàn gia sư với đánh giá & hồ sơ chi tiết, lọc theo môn học, vị trí, giá.',
      bgClass: 'bg-green-100',
    },
    {
      emoji: '📅',
      title: 'Đặt lịch linh hoạt',
      desc: 'Chọn lịch, số buổi và mục tiêu học tập. Gia sư xác nhận - bạn chỉ cần đợi kết quả!',
      bgClass: 'bg-blue-100',
    },
    {
      emoji: '💸',
      title: 'Thanh toán an toàn',
      desc: 'Đặt cọc minh bạch qua PayOS, hoàn tiền nếu gia sư hủy. Yên tâm 100%.',
      bgClass: 'bg-orange-100',
    },
  ];

  ngOnInit(): void {
    void this.loadInitialData();
  }

  async loadTutors(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.tutorsApi.getTutors(
          this.activeSubjectId() ?? undefined,
          this.provinceId() ?? undefined,
          this.wardCode() ?? undefined,
          undefined,
          undefined,
          this.page(),
          this.pageSize(),
          this.searchQuery.trim() || undefined,
          'rating',
          'desc',
        ),
      );
      this.tutors.set(response.data?.items ?? []);
      this.totalCount.set(response.data?.totalCount ?? 0);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  triggerSearch(): void {
    this.page.set(1);
    void this.loadTutors();
  }

  setSubject(subjectId: number | null): void {
    this.activeSubjectId.set(subjectId);
    this.page.set(1);
    void this.loadTutors();
  }

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);
    this.page.set(1);
    if (provinceId) {
      this.isLoadingWards.set(true);
      try {
        const response = await firstValueFrom(this.addressApi.getWards(provinceId));
        this.wards.set(response.data ?? []);
      } catch (error) {
        this.errorMessage.set(getApiErrorMessage(error, 'Không tải được phường / xã.'));
      } finally {
        this.isLoadingWards.set(false);
      }
    }
    void this.loadTutors();
  }

  setWard(wardCode: string | null): void {
    this.wardCode.set(wardCode);
    this.page.set(1);
    void this.loadTutors();
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

  subjectNames(tutor: TutorDto): string {
    return (
      tutor.subjects
        ?.map((subject) => subject.subjectName)
        .filter(Boolean)
        .join(', ') || 'Chưa cập nhật môn học'
    );
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name
      .split(' ')
      .slice(-2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
  }

  getTutorLink(tutorId?: number): string[] {
    if (!tutorId) return [];
    if (this.session.isAuthenticated() && this.session.role() === 'Student') {
      return ['/student/tutor', tutorId.toString()];
    }
    return ['/tutors', tutorId.toString()];
  }

  private async loadInitialData(): Promise<void> {
    try {
      const [subjectResponse, provinceResponse] = await Promise.all([
        firstValueFrom(this.subjectsApi.getSubjects()),
        firstValueFrom(this.addressApi.getProvinces()),
      ]);
      this.subjects.set(subjectResponse.data ?? []);
      this.provinces.set(provinceResponse.data ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được dữ liệu bộ lọc.'));
    }

    await this.loadTutors();
  }
}


