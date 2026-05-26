import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { ProvinceDto, SubjectListItemDto, TutorDto, WardDto } from '../../../api/generated/client/models';
import { AddressService, SubjectsService, TutorsService } from '../../../api/generated/client/services';
import { getApiErrorMessage } from '../../../core/http/api-error';
import { MascotComponent } from '../../../shared/components/mascot/mascot';
import { formatMoney } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-discover-tutors-page',
  imports: [FormsModule, RouterLink, MascotComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="font-display text-2xl md:text-3xl font-black text-slate-900">Khám phá Gia sư</h1>
        <p class="text-slate-500 mt-1">Tìm gia sư phù hợp nhất cho bạn</p>
      </div>

      <div class="space-y-3">
        <div class="grid lg:grid-cols-[1fr_auto] gap-3">
          <input type="text" [(ngModel)]="searchQuery" (keydown.enter)="loadTutors()"
                 placeholder="Tìm theo tên, môn học, chuyên ngành..."
                 class="tactile-input w-full text-sm font-semibold" />
          <button (click)="loadTutors()" class="tactile-button-blue px-6 py-2.5 rounded-xl text-sm font-extrabold uppercase">
            Tìm kiếm
          </button>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <select [ngModel]="activeSubjectId()" (ngModelChange)="setSubject($event)"
                  class="tactile-input w-full text-sm font-semibold bg-white">
            <option [ngValue]="null">Tất cả môn học</option>
            @for (subject of subjects(); track subject.id) {
              <option [ngValue]="subject.id">{{ subject.name }}</option>
            }
          </select>

          <select [ngModel]="provinceId()" (ngModelChange)="onProvinceChange($event)"
                  class="tactile-input w-full text-sm font-semibold bg-white">
            <option [ngValue]="null">Tất cả tỉnh / thành</option>
            @for (province of provinces(); track province.provinceId) {
              <option [ngValue]="province.provinceId">{{ province.provinceName }}</option>
            }
          </select>

          <select [ngModel]="wardCode()" (ngModelChange)="setWard($event)"
                  class="tactile-input w-full text-sm font-semibold bg-white"
                  [disabled]="!provinceId() || isLoadingWards()">
            <option [ngValue]="null">Tất cả phường / xã</option>
            @for (ward of wards(); track ward.wardCode) {
              <option [ngValue]="ward.wardCode">{{ ward.wardName }}</option>
            }
          </select>
        </div>
      </div>

      @if (errorMessage()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">
          {{ errorMessage() }}
        </p>
      }

      @if (isLoading()) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of [1,2,3,4,5,6]; track item) {
            <div class="tactile-card p-5 animate-pulse">
              <div class="h-14 bg-slate-100 rounded-xl"></div>
              <div class="h-4 bg-slate-100 rounded mt-4"></div>
              <div class="h-4 bg-slate-100 rounded mt-2 w-2/3"></div>
            </div>
          }
        </div>
      } @else if (tutors().length > 0) {
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (tutor of tutors(); track tutor.id) {
            <a [routerLink]="['/student/tutor', tutor.id]" class="tactile-card p-5 hover:shadow-lg transition-all group">
              <div class="flex items-center gap-3 mb-3">
                @if (tutor.avatarUrl) {
                  <img [src]="tutor.avatarUrl" [alt]="tutor.fullName" referrerpolicy="no-referrer"
                       class="w-14 h-14 rounded-full object-cover border-2 border-slate-100" />
                } @else {
                  <div class="w-14 h-14 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-lg border-b-4 border-duo-blue-dark">
                    {{ initials(tutor.fullName) }}
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <h3 class="font-extrabold text-slate-900 truncate group-hover:text-duo-blue transition-colors">{{ tutor.fullName }}</h3>
                  <p class="text-sm text-slate-500 truncate">{{ subjectNames(tutor) }}</p>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="flex items-center gap-1 text-amber-600 font-bold">★ {{ tutor.rating ?? 0 }}</span>
                <span class="font-extrabold text-duo-green">{{ formatPrice(tutor.hourlyRate) }}/h</span>
              </div>
              <p class="text-xs text-slate-400 mt-2 line-clamp-2">
                {{ tutor.major || tutor.school || tutor.address?.fullAddress || 'Gia sư EduMatch' }}
              </p>
            </a>
          }
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
export class DiscoverTutorsPage implements OnInit {
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

  private readonly tutorsApi = inject(TutorsService);
  private readonly subjectsApi = inject(SubjectsService);
  private readonly addressApi = inject(AddressService);

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
          1,
          12,
          this.searchQuery.trim() || undefined,
          'rating',
          'desc',
        ),
      );
      this.tutors.set(response.data?.items ?? []);
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được danh sách gia sư.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  setSubject(subjectId: number | null): void {
    this.activeSubjectId.set(subjectId);
    void this.loadTutors();
  }

  async onProvinceChange(provinceId: number | null): Promise<void> {
    this.provinceId.set(provinceId);
    this.wardCode.set(null);
    this.wards.set([]);
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
    void this.loadTutors();
  }

  subjectNames(tutor: TutorDto): string {
    return tutor.subjects?.map((subject) => subject.subjectName).filter(Boolean).join(', ') || 'Chưa cập nhật môn học';
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((part) => part[0]).join('').toUpperCase();
  }

  formatPrice(value?: number | null): string {
    return formatMoney(value);
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
