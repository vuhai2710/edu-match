import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { StudentDetailModalComponent } from '../../../shared/components/student-detail-modal';

import { CancellationRequestDto, ClassDto, ClassStatus, CancellationRequestStatus } from '../../../api/generated/client/models';
import { ClassesService, CancellationRequestsService } from '../../../api/generated/client/services';
import { SessionService } from '../../../core/auth/session';
import { getApiErrorMessage, unwrapApiData } from '../../../core/http/api-error';
import {
  classStatusLabel,
  cancellationStatusLabel,
  userRoleLabel,
  formatDate,
  formatDateTime,
  formatMoney,
  formatTimeSlots,
  paymentStatusLabel,
} from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-student-class-detail-page',
  imports: [RouterLink, FormsModule, StudentDetailModalComponent],
  template: `
    @if (classItem(); as item) {
      <div class="max-w-3xl mx-auto space-y-6">
        <a [routerLink]="backLink()" class="text-sm font-bold text-slate-500 hover:text-slate-800">← Quay lại</a>

        <div class="tactile-card p-6 space-y-5">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 class="font-display text-2xl font-black text-slate-900">{{ item.subjectName || item.code }}</h1>
              <p class="text-sm text-slate-500 mt-1">Mã lớp: {{ item.code }}</p>
            </div>
            <span [class]="statusBadgeClass(item.status)" class="rounded-full px-3 py-1 text-xs font-black">
              {{ label(item.status) }}
            </span>
          </div>

          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">{{ isTutor() ? 'Học viên' : 'Gia sư' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <p class="font-extrabold text-slate-900">
                  {{ isTutor() ? (item.studentName || 'Đang cập nhật') : (item.tutorName || 'Đang cập nhật') }}
                </p>
                @if (isTutor() && item.studentId) {
                  <button (click)="openStudentDetail(item.studentId)" 
                          class="text-xs font-extrabold text-duo-blue hover:text-duo-blue-dark hover:underline">
                    (Xem chi tiết)
                  </button>
                }
              </div>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Ngày bắt đầu</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ date(item.startDate) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Lịch học</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ slots(item) }}</p>
            </div>
            <div class="rounded-2xl bg-slate-50 p-4">
              <p class="font-bold text-slate-500">Nguồn lịch</p>
              <p class="mt-1 font-extrabold text-slate-900">{{ scheduleSourceLabel(item.acceptedScheduleSource) }}</p>
            </div>
          </div>
        </div>

        <div class="tactile-card p-6 space-y-4">
          <h2 class="font-extrabold text-lg text-slate-900">Thanh toán</h2>
          <div class="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p class="text-slate-500 font-bold">Số tiền</p>
              <p class="font-extrabold text-duo-green">{{ money(item.paymentSummary?.amount ?? item.depositAmountSnapshot) }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Trạng thái</p>
              <p class="font-extrabold text-slate-900">{{ paymentLabel(item.paymentSummary?.status) }}</p>
            </div>
            <div>
              <p class="text-slate-500 font-bold">Đã thanh toán lúc</p>
              <p class="font-extrabold text-slate-900">{{ dateTime(item.paymentSummary?.paidAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Hủy lớp UI / UX -->
        @if (cancellationRequest(); as req) {
          <div class="tactile-card p-6 space-y-4 border-2 border-orange-100 bg-orange-50/5">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 class="font-extrabold text-lg text-slate-900">Yêu cầu hủy lớp</h2>
              <span [class]="reqBadgeClass(req.status)" class="rounded-full px-3 py-1 text-xs font-black">
                {{ reqStatusLabel(req.status) }}
              </span>
            </div>

            <div class="space-y-3 text-sm">
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Người yêu cầu:</span>
                {{ req.requestedByUserName || 'Không rõ' }} 
                <span class="ml-1 text-xs rounded bg-slate-100 px-2 py-0.5 text-slate-600">{{ reqRoleLabel(req.requestedByRole) }}</span>
              </p>
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Lý do:</span>
                {{ req.reason || 'Không có lý do.' }}
              </p>
              <p class="text-slate-600">
                <span class="font-bold text-slate-700">Ngày yêu cầu:</span>
                {{ dateTime(req.createdAt) }}
              </p>

              @if (req.status === 'Resolved') {
                <div class="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200 space-y-2">
                  <p class="font-bold text-duo-green text-sm">✓ Yêu cầu hủy đã được Admin xử lý</p>
                  <p class="text-xs text-slate-600">
                    <span class="font-bold text-slate-700">Số tiền hoàn cọc:</span>
                    <span class="font-extrabold text-duo-green">{{ money(req.refundAmount) }}</span>
                  </p>
                  @if (req.refundNote) {
                    <p class="text-xs text-slate-600 font-medium">
                      <span class="font-bold text-slate-700">Ghi chú hoàn cọc:</span>
                      {{ req.refundNote }}
                    </p>
                  }
                  @if (req.resolvedAt) {
                    <p class="text-xs text-slate-500">
                      <span class="font-bold text-slate-600">Thời gian xử lý:</span>
                      {{ dateTime(req.resolvedAt) }}
                    </p>
                  }
                </div>
              } @else {
                <div class="mt-4 p-4 rounded-2xl bg-orange-50 border border-orange-100">
                  <p class="font-bold text-duo-orange text-sm flex items-center gap-1.5">
                    <span>⚠</span> Đang chờ Quản trị viên duyệt và hoàn tiền cọc.
                  </p>
                </div>
              }
            </div>
          </div>
        } @else if (item.status === 'PendingStart') {
          @if (!showCancelForm()) {
            <div class="flex justify-end mt-4">
              <button (click)="showCancelForm.set(true)"
                      class="bg-red-500 hover:bg-red-600 text-white font-extrabold px-6 py-3 rounded-xl border-b-4 border-red-700 hover:opacity-95 transition-all text-sm">
                Yêu cầu hủy lớp học
              </button>
            </div>
          } @else {
            <div class="tactile-card p-6 space-y-4 border-2 border-red-200 bg-red-50/10">
              <h3 class="font-extrabold text-lg text-slate-900 flex items-center gap-2">
                <span class="text-red-500">⚠</span> Xác nhận yêu cầu hủy lớp
              </h3>
              
              <p class="text-xs text-slate-500 leading-relaxed">
                Lưu ý: Yêu cầu hủy lớp của bạn sẽ được gửi tới Admin để xác minh lý do và phê duyệt hoàn trả tiền đặt cọc theo chính sách của EduMatch.
              </p>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-1">Lý do hủy lớp <span class="text-red-500">*</span></label>
                <textarea [(ngModel)]="cancelReason" rows="3"
                          placeholder="Vui lòng nhập rõ lý do hủy lớp để Admin phê duyệt..."
                          class="w-full rounded-xl border-2 border-slate-200 px-3 py-2 text-sm focus:border-red-500 outline-none"></textarea>
              </div>

              @if (cancelErrorMessage()) {
                <p class="text-xs font-bold text-red-500">{{ cancelErrorMessage() }}</p>
              }

              <div class="flex justify-end gap-3">
                <button (click)="showCancelForm.set(false); cancelReason.set(''); cancelErrorMessage.set('')"
                        [disabled]="isSubmittingCancel()"
                        class="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                  Hủy bỏ
                </button>
                <button (click)="submitCancellation(item.id!)"
                        [disabled]="isSubmittingCancel() || !cancelReason().trim()"
                        class="bg-red-500 hover:bg-red-600 text-white font-extrabold px-5 py-2 rounded-xl border-b-4 border-red-700 hover:opacity-95 disabled:opacity-50 transition-all text-sm">
                  {{ isSubmittingCancel() ? 'Đang gửi...' : 'Gửi yêu cầu' }}
                </button>
              </div>
            </div>
          }
        }

        @if (errorMessage()) {
          <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ errorMessage() }}</p>
        }

        <!-- Student Detail Modal overlay -->
        @if (selectedStudentId()) {
          <app-student-detail-modal [studentId]="selectedStudentId()" (close)="selectedStudentId.set(null)" />
        }
      </div>
    } @else if (isLoading()) {
      <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải lớp học...</div>
    }
  `,
})
export class StudentClassDetailPage implements OnInit {
  classItem = signal<ClassDto | null>(null);
  cancellationRequest = signal<CancellationRequestDto | null>(null);
  isLoading = signal(false);
  errorMessage = signal('');

  showCancelForm = signal(false);
  cancelReason = signal('');
  cancelErrorMessage = signal('');
  isSubmittingCancel = signal(false);

  private readonly route = inject(ActivatedRoute);
  private readonly classesApi = inject(ClassesService);
  private readonly cancellationApi = inject(CancellationRequestsService);
  private readonly sessionService = inject(SessionService);

  backLink = computed(() => this.sessionService.role() === 'Tutor' ? '/tutor/classes' : '/student/classes');
  isTutor = computed(() => this.sessionService.role() === 'Tutor');
  selectedStudentId = signal<number | null>(null);

  openStudentDetail(studentId: number): void {
    this.selectedStudentId.set(studentId);
  }

  scheduleSourceLabel(src?: string | null): string {
    if (src === 'R1') return 'Học viên đề xuất';
    if (src === 'R2') return 'Gia sư đề xuất';
    return 'Chưa rõ';
  }

  ngOnInit(): void {
    void this.loadClass();
  }

  label = classStatusLabel;
  paymentLabel = paymentStatusLabel;
  reqStatusLabel = cancellationStatusLabel;
  reqRoleLabel = userRoleLabel;

  date(value?: Date | null): string {
    return formatDate(value);
  }

  dateTime(value?: Date | null): string {
    return formatDateTime(value);
  }

  slots(item: ClassDto): string {
    return formatTimeSlots(item.timeSlots);
  }

  money(value?: number | null): string {
    return formatMoney(value);
  }

  statusBadgeClass(status?: ClassStatus | null): string {
    if (!status) return 'bg-slate-50 text-slate-500';
    switch (status) {
      case 'PendingStart':
        return 'bg-blue-50 text-duo-blue';
      case 'Active':
        return 'bg-green-50 text-duo-green';
      default:
        return 'bg-red-50 text-duo-red';
    }
  }

  reqBadgeClass(status?: CancellationRequestStatus | null): string {
    return status === 'Resolved'
      ? 'bg-green-50 text-duo-green'
      : 'bg-orange-50 text-duo-orange';
  }

  private async loadClass(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorMessage.set('Mã lớp không hợp lệ.');
      return;
    }

    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.classesApi.getClassById(id));
      const classData = unwrapApiData(response);
      this.classItem.set(classData);
      if (classData?.id) {
        await this.loadCancellationRequest(classData.id);
      }
    } catch (error) {
      this.errorMessage.set(getApiErrorMessage(error, 'Không tải được lớp học.'));
    } finally {
      this.isLoading.set(false);
    }
  }

  private async loadCancellationRequest(classId: number): Promise<void> {
    try {
      const response = await firstValueFrom(this.classesApi.getClassCancellationRequest(classId));
      this.cancellationRequest.set(response.data ?? null);
    } catch (error) {
      this.cancellationRequest.set(null);
    }
  }

  async submitCancellation(classId?: number): Promise<void> {
    if (!classId) return;
    const reason = this.cancelReason().trim();
    if (!reason) {
      this.cancelErrorMessage.set('Lý do hủy lớp là bắt buộc.');
      return;
    }

    this.isSubmittingCancel.set(true);
    this.cancelErrorMessage.set('');
    try {
      await firstValueFrom(
        this.cancellationApi.createCancellationRequest({
          classId,
          reason,
        })
      );
      this.showCancelForm.set(false);
      this.cancelReason.set('');
      await this.loadClass();
    } catch (error) {
      this.cancelErrorMessage.set(getApiErrorMessage(error, 'Không gửi được yêu cầu hủy lớp.'));
    } finally {
      this.isSubmittingCancel.set(false);
    }
  }
}
