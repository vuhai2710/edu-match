import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { SubjectDto, SubjectListItemDto } from '../../../api/generated/client/models';
import { SubjectsService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails, getApiErrorMessage } from '../../../core/http/api-error';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { MascotComponent } from '../../../shared/components/mascot/mascot';

@Component({
  selector: 'app-admin-subjects-page',
  standalone: true,
  imports: [ErrorBannerComponent, MascotComponent, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Title Section -->
      <div>
        <h1 class="font-display text-2xl font-black text-slate-900">Quản lý môn học</h1>
        <p class="text-sm text-slate-500 mt-1">
          Quản lý danh sách môn học giảng dạy trong hệ thống EduMatch.
        </p>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Left Column: Subjects List (7/12) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Search input -->
          <div class="relative">
            <input
              type="text"
              [ngModel]="searchTerm()"
              (ngModelChange)="searchTerm.set($event)"
              placeholder="Tìm kiếm môn học theo tên hoặc mô tả..."
              class="w-full rounded-xl border-2 border-slate-200 px-4 py-2.5 pl-10 text-sm focus:border-duo-blue outline-none bg-white transition-all"
            />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Subjects List Card -->
          <div class="tactile-card overflow-hidden">
            @if (isLoading()) {
              <div class="p-12 text-center space-y-3">
                <div class="w-12 h-12 border-4 border-duo-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p class="text-sm font-bold text-slate-500">Đang tải danh sách môn học...</p>
              </div>
            } @else if (filteredSubjects().length === 0) {
              <div class="p-8 text-center space-y-4">
                <app-mascot type="sadMagnifier" [size]="100" />
                <div>
                  <p class="font-extrabold text-slate-800 text-lg">Không tìm thấy môn học nào</p>
                  <p class="text-sm text-slate-500 mt-1">
                    @if (searchTerm()) {
                      Thử thay đổi từ khóa tìm kiếm của bạn.
                    } @else {
                      Hệ thống chưa có môn học nào. Hãy tạo môn học mới!
                    }
                  </p>
                </div>
              </div>
            } @else {
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-slate-50 border-b-2 border-slate-100">
                    <tr>
                      <th class="px-4 py-3 text-left font-extrabold text-slate-600">Tên môn học</th>
                      <th class="px-4 py-3 text-left font-extrabold text-slate-600">Mô tả</th>
                      <th class="px-4 py-3 text-center font-extrabold text-slate-600">Số gia sư dạy</th>
                      <th class="px-4 py-3 text-right font-extrabold text-slate-600">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (sub of filteredSubjects(); track sub.id) {
                      <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        <td class="px-4 py-3">
                          <p class="font-extrabold text-slate-900">{{ sub.name }}</p>
                        </td>
                        <td class="px-4 py-3 text-slate-500 max-w-[200px] truncate" [title]="sub.description || ''">
                          {{ sub.description || '—' }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-50 text-duo-blue border border-blue-100">
                            {{ sub.tutorCount ?? 0 }} gia sư
                          </span>
                        </td>
                        <td class="px-4 py-3 text-right">
                          <div class="flex justify-end gap-3">
                            <button
                              (click)="selectSubjectForEdit(sub)"
                              class="text-duo-blue font-extrabold text-xs hover:underline"
                            >
                              Sửa
                            </button>
                            <button
                              (click)="deleteSubject(sub)"
                              [disabled]="(sub.tutorCount ?? 0) > 0"
                              [title]="(sub.tutorCount ?? 0) > 0 ? 'Không thể xóa môn học đang có gia sư đăng ký dạy' : ''"
                              class="text-duo-red font-extrabold text-xs hover:underline disabled:opacity-40 disabled:no-underline"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        </div>

        <!-- Right Column: Add/Edit Form (5/12) -->
        <div class="lg:col-span-5">
          <div class="tactile-card p-6 space-y-6 relative overflow-hidden bg-white">
            <div class="space-y-1">
              <h2 class="font-display text-xl font-black text-slate-800">
                {{ editingSubjectId() ? 'Chỉnh sửa môn học' : 'Tạo môn học mới' }}
              </h2>
              <p class="text-xs text-slate-500">
                {{ editingSubjectId() ? 'Cập nhật lại thông tin môn học.' : 'Nhập thông tin để tạo môn học mới.' }}
              </p>
            </div>

            @if (formError()) {
              <div class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red flex items-center gap-2">
                <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{{ formError() }}</span>
              </div>
            }

            @if (formSuccess()) {
              <div class="rounded-xl border-2 border-green-100 bg-green-50 px-4 py-3 text-sm font-bold text-duo-green flex items-center gap-2">
                <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{{ formSuccess() }}</span>
              </div>
            }

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1">
                  Tên môn học <span class="text-duo-red">*</span>
                </label>
                <input
                  type="text"
                  [ngModel]="subjectName()"
                  (ngModelChange)="subjectName.set($event)"
                  placeholder="Ví dụ: Toán học, Lập trình Web..."
                  maxlength="100"
                  class="w-full tactile-input bg-white text-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-extrabold text-slate-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  [ngModel]="subjectDescription()"
                  (ngModelChange)="subjectDescription.set($event)"
                  placeholder="Mô tả tóm tắt về môn học này..."
                  rows="4"
                  class="w-full tactile-input bg-white text-sm resize-none"
                ></textarea>
              </div>
            </div>

            <div class="flex items-center gap-3 pt-2">
              <button
                (click)="saveSubject()"
                [disabled]="isSubmitting() || !subjectName().trim()"
                class="flex-1 tactile-button-green py-3 px-4 font-black rounded-xl text-sm disabled:opacity-50 disabled:pointer-events-none"
              >
                {{ isSubmitting() ? 'Đang lưu...' : (editingSubjectId() ? 'Cập nhật' : 'Thêm mới') }}
              </button>

              @if (editingSubjectId()) {
                <button
                  (click)="cancelEdit()"
                  [disabled]="isSubmitting()"
                  class="tactile-button-gray py-3 px-4 font-black rounded-xl text-sm"
                >
                  Hủy
                </button>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class AdminSubjectsPage implements OnInit {
  // Lists
  subjects = signal<SubjectListItemDto[]>([]);
  searchTerm = signal('');
  filteredSubjects = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return this.subjects();
    return this.subjects().filter(
      (sub) =>
        (sub.name ?? '').toLowerCase().includes(term) ||
        (sub.description && sub.description.toLowerCase().includes(term))
    );
  });

  // State flags
  isLoading = signal(false);
  isSubmitting = signal(false);
  errorDetails = signal<ApiErrorDetails | null>(null);
  formError = signal<string | null>(null);
  formSuccess = signal<string | null>(null);

  // Form states
  subjectName = signal('');
  subjectDescription = signal('');
  editingSubjectId = signal<number | null>(null);

  private readonly subjectsApi = inject(SubjectsService);

  ngOnInit(): void {
    void this.loadSubjects();
  }

  async loadSubjects(): Promise<void> {
    this.isLoading.set(true);
    this.errorDetails.set(null);
    try {
      const response = await firstValueFrom(this.subjectsApi.getSubjects());
      this.subjects.set(response.data ?? []);
    } catch (error) {
      console.error('[AdminSubjectsPage] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không thể tải danh sách môn học.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  selectSubjectForEdit(subject: SubjectListItemDto): void {
    this.editingSubjectId.set(Number(subject.id));
    this.subjectName.set(subject.name ?? '');
    this.subjectDescription.set(subject.description || '');
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  cancelEdit(): void {
    this.editingSubjectId.set(null);
    this.subjectName.set('');
    this.subjectDescription.set('');
    this.formError.set(null);
    this.formSuccess.set(null);
  }

  async saveSubject(): Promise<void> {
    const name = this.subjectName().trim();
    const description = this.subjectDescription().trim() || undefined;

    if (!name) {
      this.formError.set('Tên môn học không được để trống.');
      return;
    }

    this.formError.set(null);
    this.formSuccess.set(null);
    this.isSubmitting.set(true);

    const dto: SubjectDto = {
      name,
      description
    };

    try {
      const editId = this.editingSubjectId();
      if (editId) {
        await firstValueFrom(this.subjectsApi.updateSubject(editId, dto));
        this.formSuccess.set('Cập nhật môn học thành công.');
      } else {
        await firstValueFrom(this.subjectsApi.createSubject(dto));
        this.formSuccess.set('Tạo môn học mới thành công.');
      }
      this.cancelEdit();
      await this.loadSubjects();
    } catch (error) {
      console.error('[AdminSubjectsPage] save failed', error);
      this.formError.set(getApiErrorMessage(error, 'Lưu môn học thất bại.'));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async deleteSubject(sub: SubjectListItemDto): Promise<void> {
    if (!sub.id) return;
    if ((sub.tutorCount ?? 0) > 0) {
      alert('Không thể xóa môn học đang có gia sư đăng ký dạy.');
      return;
    }

    const confirmed = window.confirm(`Bạn có chắc chắn muốn xóa môn học "${sub.name}"?`);
    if (!confirmed) return;

    this.formError.set(null);
    this.formSuccess.set(null);

    try {
      await firstValueFrom(this.subjectsApi.deleteSubject(Number(sub.id)));
      this.formSuccess.set(`Đã xóa môn học "${sub.name}" thành công.`);
      if (this.editingSubjectId() === Number(sub.id)) {
        this.cancelEdit();
      }
      await this.loadSubjects();
    } catch (error) {
      console.error('[AdminSubjectsPage] delete failed', error);
      this.formError.set(getApiErrorMessage(error, 'Xóa môn học thất bại.'));
    }
  }
}
