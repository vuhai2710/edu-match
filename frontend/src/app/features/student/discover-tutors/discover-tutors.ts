import { Component, OnInit, OnDestroy, inject, signal, computed, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, Subscription, firstValueFrom } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

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
import {
  RecommendationsApiService,
  TutorRecommendationDto,
} from '../../../api/facades/recommendations-api';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { PaginationComponent } from '../../../shared/components/pagination/pagination';
import { formatMoney } from '../../../shared/utils/api-ui';
import { TactileSelectComponent } from '../../../shared/components/tactile-select/tactile-select';

@Component({
  selector: 'app-discover-tutors-page',
  imports: [FormsModule, RouterLink, MascotComponent, PaginationComponent, TactileSelectComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-black text-slate-900">Khám phá Gia sư</h1>
        <p class="text-slate-500 mt-1">Tìm gia sư phù hợp nhất cho bạn</p>
      </div>

      <div class="bg-white p-4 md:p-5 rounded-2xl border-2 border-slate-100 shadow-sm space-y-4">
        <!-- Search and Sort row -->
        <div class="grid md:grid-cols-[1fr_240px] gap-3">
          <!-- Search input -->
          <div class="relative w-full">
            <input
              type="text"
              [ngModel]="searchQuery"
              (ngModelChange)="onSearchQueryChange($event)"
              placeholder="Tìm theo tên, mã gia sư, chuyên ngành"
              class="tactile-input w-full text-sm font-semibold pl-10 pr-10"
            />
            @if (searchQuery) {
              <button
                (click)="clearSearchQuery()"
                class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-slate-100 transition-all cursor-pointer"
              >
                ✕
              </button>
            }
          </div>

          <!-- Sort dropdown -->
          <div class="relative w-full">
            <app-tactile-select
              [value]="sortSelection()"
              (valueChange)="onSortChange($event)"
              [options]="sortOptions"
              [clearable]="true"
              defaultValue="createdat_desc"
              [showPlaceholderOption]="false"
            />
          </div>
        </div>

        <!-- Filters row -->
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <!-- Subject select -->
          <div class="relative">
            <app-tactile-select
              [value]="activeSubjectId()"
              (valueChange)="setSubject($event)"
              [options]="subjects()"
              valueKey="id"
              labelKey="name"
              placeholder="Tất cả môn học"
              [clearable]="true"
              [defaultValue]="null"
            />
          </div>

          <!-- Province select -->
          <div class="relative">
            <app-tactile-select
              [value]="provinceId()"
              (valueChange)="onProvinceChange($event)"
              [options]="provinces()"
              valueKey="provinceId"
              labelKey="provinceName"
              placeholder="Tất cả tỉnh / thành"
              [clearable]="true"
              [defaultValue]="null"
            />
          </div>

          <!-- Ward select -->
          <div class="relative">
            <app-tactile-select
              #wardSelect
              [value]="wardCode()"
              (valueChange)="setWard($event)"
              [options]="wards()"
              valueKey="wardCode"
              labelKey="wardName"
              placeholder="Tất cả phường / xã"
              [disabled]="!provinceId() || isLoadingWards()"
              [clearable]="true"
              [defaultValue]="null"
            />
          </div>
        </div>

        <!-- Price Range and Reset row -->
        <div
          class="flex flex-col lg:flex-row lg:items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100/80"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 w-full">
            <span class="text-xs text-slate-500 font-extrabold shrink-0 uppercase tracking-wider"
              >Khoảng giá (vnđ/h):</span
            >

            <div class="flex items-center gap-2 flex-1 w-full">
              <div class="relative flex-1 max-w-[200px]">
                <input
                  type="number"
                  [ngModel]="minPrice()"
                  (ngModelChange)="onMinPriceChange($event)"
                  placeholder="Từ (đ)"
                  class="tactile-input py-1.5 px-3 w-full text-xs font-semibold pr-7"
                  min="0"
                />
                @if (minPrice() !== null && minPrice() !== undefined) {
                  <button
                    (click)="onMinPriceChange(null)"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                }
              </div>

              <span class="text-slate-400 text-xs font-extrabold">-</span>

              <div class="relative flex-1 max-w-[200px]">
                <input
                  type="number"
                  [ngModel]="maxPrice()"
                  (ngModelChange)="onMaxPriceChange($event)"
                  placeholder="Đến (đ)"
                  class="tactile-input py-1.5 px-3 w-full text-xs font-semibold pr-7"
                  min="0"
                />
                @if (maxPrice() !== null && maxPrice() !== undefined) {
                  <button
                    (click)="onMaxPriceChange(null)"
                    class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200 transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                }
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 shrink-0">
            <button
              (click)="resetFilters()"
              [disabled]="!hasActiveFilters()"
              class="tactile-button-gray py-2 px-4 rounded-xl text-xs font-extrabold uppercase disabled:opacity-50 disabled:pointer-events-none disabled:transform-none disabled:border-b-4 flex items-center shadow-sm transition-all"
            >
              Đặt lại
            </button>
          </div>
        </div>
      </div>

      @if (priceValidationError()) {
        <p
          class="rounded-xl border-2 border-amber-100 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-700 animate-pulse"
        >
          ⚠️ {{ priceValidationError() }}
        </p>
      }

      @if (errorMessage()) {
        <p
          class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red"
        >
          {{ errorMessage() }}
        </p>
      }

      @if (isLoadingRecommendations()) {
        <div class="grid sm:grid-cols-3 gap-4">
          @for (item of [1, 2, 3]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-14 bg-slate-100 rounded-xl"></div>
              <div class="h-4 bg-slate-100 rounded mt-4"></div>
              <div class="h-4 bg-slate-100 rounded mt-2 w-2/3"></div>
            </div>
          }
        </div>
      } @else if (showRecommendations()) {
        <section class="space-y-3">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="font-display text-xl font-black text-slate-900">
                {{ recommendationTitle() }}
              </h2>
              @if (recommendationError()) {
                <p class="text-xs font-bold text-amber-600 mt-1">{{ recommendationError() }}</p>
              }
            </div>
          </div>

          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (item of recommendedTutors(); track item.tutor?.id) {
              @if (item.tutor; as tutor) {
                <a
                  [routerLink]="['/student/tutor', tutor.id]"
                  [queryParams]="activeSubjectId() ? { subjectId: activeSubjectId() } : {}"
                  class="tactile-card p-5 hover:shadow-lg transition-all group border-duo-green"
                >
                  <div class="flex items-center gap-3 mb-3">
                    @if (tutor.avatarUrl && !avatarErrors()[tutor.id!]) {
                      <img
                        [src]="tutor.avatarUrl"
                        [alt]="tutor.fullName"
                        referrerpolicy="no-referrer"
                        (error)="handleAvatarError(tutor.id!)"
                        class="w-14 h-14 rounded-full object-cover border-2 border-slate-100"
                      />
                    } @else {
                      <div
                        class="w-14 h-14 rounded-full bg-duo-green text-white flex items-center justify-center font-black text-lg border-b-4 border-duo-green-dark"
                      >
                        {{ initials(tutor.fullName) }}
                      </div>
                    }
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <h3
                          class="font-extrabold text-slate-900 truncate group-hover:text-duo-green transition-colors"
                        >
                          {{ tutor.fullName }}
                        </h3>
                        <span class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-duo-green shrink-0">
                          Phù hợp nhất
                        </span>
                      </div>
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
                    <span class="font-extrabold text-duo-green">{{ formatPrice(tutor.hourlyRate) }}/h</span>
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
            }
          </div>
        </section>
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
        <div
          class="space-y-6 relative transition-opacity duration-200"
          [class.opacity-50]="isLoading()"
          [class.pointer-events-none]="isLoading()"
        >
          <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (tutor of displayedTutors(); track tutor.id) {
              <a
                [routerLink]="['/student/tutor', tutor.id]"
                [queryParams]="activeSubjectId() ? { subjectId: activeSubjectId() } : {}"
                class="tactile-card p-5 hover:shadow-lg transition-all group"
              >
                <div class="flex items-center gap-3 mb-3">
                  @if (tutor.avatarUrl && !avatarErrors()[tutor.id!]) {
                    <img
                      [src]="tutor.avatarUrl"
                      [alt]="tutor.fullName"
                      referrerpolicy="no-referrer"
                      (error)="handleAvatarError(tutor.id!)"
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
                    <div class="flex items-center gap-2">
                      <h3
                        class="font-extrabold text-slate-900 truncate group-hover:text-duo-blue transition-colors"
                      >
                        {{ tutor.fullName }}
                      </h3>
                      @if (isRecommended(tutor.id)) {
                        <span class="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-black text-duo-green shrink-0">
                          Được gợi ý
                        </span>
                      }
                    </div>
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

          <app-pagination
            [page]="page()"
            [pageSize]="pageSize()"
            [pageSizeOptions]="[6, 12, 18, 24]"
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
  `,
})
export class DiscoverTutorsPage implements OnInit, OnDestroy {
  readonly sortOptions = [
    { value: 'createdat_desc', label: 'Mặc định' },
    { value: 'rating_desc', label: 'Đánh giá cao nhất' },
    { value: 'hourlyrate_asc', label: 'Giá tăng dần' },
    { value: 'hourlyrate_desc', label: 'Giá giảm dần' },
  ];

  searchQuery = '';
  tutors = signal<TutorDto[]>([]);
  recommendedTutors = signal<TutorRecommendationDto[]>([]);
  avatarErrors = signal<Record<number | string, boolean>>({});

  showRecommendations = computed(() => {
    return this.page() === 1 && this.recommendedTutors().length > 0;
  });

  displayedTutors = computed(() => {
    const recommendedIds = new Set(this.recommendedTutors().map((r) => r.tutor?.id));
    const filtered = this.tutors().filter((t) => t.id != null && !recommendedIds.has(t.id));
    
    if (this.showRecommendations()) {
      const remainingSlots = Math.max(0, this.pageSize() - this.recommendedTutors().length);
      return filtered.slice(0, remainingSlots);
    }
    
    return filtered;
  });

  handleAvatarError(tutorId: string | number): void {
    this.avatarErrors.update((prev) => ({ ...prev, [tutorId]: true }));
  }

  subjects = signal<SubjectListItemDto[]>([]);
  provinces = signal<ProvinceDto[]>([]);
  wards = signal<WardDto[]>([]);
  activeSubjectId = signal<number | null>(null);
  provinceId = signal<number | null>(null);
  wardCode = signal<string | null>(null);
  wardSelect = viewChild<TactileSelectComponent>('wardSelect');
  isLoading = signal(false);
  isLoadingRecommendations = signal(false);
  isLoadingWards = signal(false);
  errorMessage = signal('');
  recommendationError = signal('');
  isRecommendationFallback = signal(false);

  // Pagination states
  page = signal(1);
  pageSize = signal(6);
  totalCount = signal(0);

  // Sorting & Range states
  sortSelection = signal<string>('createdat_desc');
  sortColumn = signal<string>('createdat');
  sortDirection = signal<string>('desc');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  priceValidationError = signal<string>('');

  filterSubject = new Subject<void>();
  private filterSubscription?: Subscription;

  private readonly tutorsApi = inject(TutorsService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly addressApi = inject(AddressService);
  private readonly recommendationsApi = inject(RecommendationsApiService);

  ngOnInit(): void {
    void this.loadInitialData();

    this.filterSubscription = this.filterSubject.pipe(debounceTime(300)).subscribe(() => {
      if (this.validatePrices()) {
        this.page.set(1);
        void this.loadTutors();
        void this.loadRecommendations();
      }
    });
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  async loadTutors(): Promise<void> {
    if (!this.validatePrices()) return;
    this.isLoading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(
        this.tutorsApi.getTutors(
          this.activeSubjectId() ?? undefined,
          this.provinceId() ?? undefined,
          this.wardCode() ?? undefined,
          this.minPrice() ?? undefined,
          this.maxPrice() ?? undefined,
          this.page(),
          this.pageSize(),
          this.searchQuery.trim() || undefined,
          this.sortColumn(),
          this.sortDirection(),
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

  async loadRecommendations(): Promise<void> {
    if (!this.validatePrices()) return;

    this.isLoadingRecommendations.set(true);
    this.recommendationError.set('');
    try {
      const response = await firstValueFrom(
        this.recommendationsApi.getTutorRecommendations({
          subjectId: this.activeSubjectId(),
          provinceId: this.provinceId(),
          wardCode: this.wardCode(),
          minPrice: this.minPrice(),
          maxPrice: this.maxPrice(),
          searchTerm: this.searchQuery.trim() || null,
        }),
      );
      const payload = response.data;
      this.recommendedTutors.set(payload?.items ?? []);
      this.isRecommendationFallback.set(!!payload?.isFallback);
    } catch (error) {
      this.recommendedTutors.set([]);
      this.isRecommendationFallback.set(false);
      this.recommendationError.set(getApiErrorMessage(error, 'Không tải được gợi ý gia sư.'));
    } finally {
      this.isLoadingRecommendations.set(false);
    }
  }

  onSearchQueryChange(val: string): void {
    this.searchQuery = val;
    this.filterSubject.next();
  }

  clearSearchQuery(): void {
    this.searchQuery = '';
    this.filterSubject.next();
  }

  onMinPriceChange(val: number | null): void {
    this.minPrice.set(val);
    this.validatePrices();
    this.filterSubject.next();
  }

  onMaxPriceChange(val: number | null): void {
    this.maxPrice.set(val);
    this.validatePrices();
    this.filterSubject.next();
  }

  validatePrices(): boolean {
    const min = this.minPrice();
    const max = this.maxPrice();
    if (min !== null && min !== undefined && max !== null && max !== undefined && min > max) {
      this.priceValidationError.set('Giá tối thiểu không được lớn hơn giá tối đa.');
      return false;
    }
    this.priceValidationError.set('');
    return true;
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery ||
      this.activeSubjectId() !== null ||
      this.provinceId() !== null ||
      this.wardCode() !== null ||
      this.minPrice() !== null ||
      this.maxPrice() !== null ||
      this.sortSelection() !== 'createdat_desc'
    );
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.activeSubjectId.set(null);
    this.provinceId.set(null);
    this.wardCode.set(null);
    this.wards.set([]);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.sortSelection.set('createdat_desc');
    this.sortColumn.set('createdat');
    this.sortDirection.set('desc');
    this.priceValidationError.set('');
    this.page.set(1);
    void this.loadTutors();
    void this.loadRecommendations();
  }

  triggerSearch(): void {
    this.page.set(1);
    void this.loadTutors();
    void this.loadRecommendations();
  }

  setSubject(subjectId: number | null): void {
    this.activeSubjectId.set(subjectId);
    this.page.set(1);
    void this.loadTutors();
    void this.loadRecommendations();
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
        setTimeout(() => {
          this.wardSelect()?.openDropdown();
        }, 0);
      } catch (error) {
        this.errorMessage.set(getApiErrorMessage(error, 'Không tải được phường / xã.'));
      } finally {
        this.isLoadingWards.set(false);
      }
    }
    void this.loadTutors();
    void this.loadRecommendations();
  }

  setWard(wardCode: string | null): void {
    this.wardCode.set(wardCode);
    this.page.set(1);
    void this.loadTutors();
    void this.loadRecommendations();
  }

  onSortChange(selection: string): void {
    this.sortSelection.set(selection);
    const [column, direction] = selection.split('_');
    this.sortColumn.set(column);
    this.sortDirection.set(direction);
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

  recommendationTitle(): string {
    if (this.isRecommendationFallback()) return 'Gia sư nổi bật';
    return this.hasActiveFilters() ? 'Gợi ý theo lựa chọn của bạn' : 'Gợi ý dành cho bạn';
  }

  similarityPercent(value?: number | null): number {
    return Math.round((value ?? 0) * 100);
  }

  isRecommended(tutorId?: number | null): boolean {
    if (!tutorId) return false;
    return this.recommendedTutors().some((item) => item.tutor?.id === tutorId);
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
    await this.loadRecommendations();
  }
}
