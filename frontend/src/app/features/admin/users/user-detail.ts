import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { UserDto, UserRole } from '../../../api/generated/client/models';
import { UsersService } from '../../../api/generated/client/services';
import { ApiErrorDetails, getApiErrorDetails, getApiErrorMessage } from '../../../core/http/api-error';
import { SessionService } from '../../../core/auth/session';
import { ErrorBannerComponent } from '../../../shared/components/error-banner/error-banner';
import { userRoleLabel, genderLabel } from '../../../shared/utils/api-ui';

@Component({
  selector: 'app-admin-user-detail-page',
  imports: [ErrorBannerComponent, RouterLink],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-3">
        <a routerLink="/admin/users" class="text-sm font-bold text-duo-blue hover:underline">← Quay lại danh sách</a>
      </div>

      @if (errorDetails()) {
        <app-error-banner [details]="errorDetails()" />
      }
      @if (actionError()) {
        <p class="rounded-xl border-2 border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-duo-red">{{ actionError() }}</p>
      }

      @if (user(); as u) {
        <!-- Summary card -->
        <div class="tactile-card p-6">
          <div class="flex flex-col sm:flex-row items-start gap-5">
            @if (u.avatarUrl) {
              <img [src]="u.avatarUrl" [alt]="u.fullName || ''"
                   class="w-20 h-20 rounded-full object-cover border-2 border-slate-200" />
            } @else {
              <div class="w-20 h-20 rounded-full bg-duo-blue text-white flex items-center justify-center font-black text-2xl border-b-4 border-duo-blue-dark">
                {{ initials(u.fullName) }}
              </div>
            }
            <div class="flex-1 space-y-2">
              <div class="flex flex-wrap items-center gap-3">
                <h1 class="font-display text-2xl font-black text-slate-900">{{ u.fullName || 'Không rõ' }}</h1>
                <span class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">{{ roleLabel(u.role) }}</span>
                @if (u.isActive) {
                  <span class="rounded-full bg-green-50 px-3 py-1 text-xs font-black text-duo-green">Đang hoạt động</span>
                } @else {
                  <span class="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-duo-red">Đã khóa</span>
                }
              </div>
              <p class="text-sm text-slate-500">{{ subtitle(u) }}</p>
            </div>
            @if (canDelete()) {
              <button (click)="confirmDelete()"
                      [disabled]="isDeleting()"
                      class="px-4 py-2 rounded-xl border-2 border-red-200 text-duo-red font-bold text-sm hover:bg-red-50 disabled:opacity-50">
                Xóa người dùng
              </button>
            }
          </div>
        </div>

        <!-- Detail card -->
        <div class="tactile-card p-6 space-y-4">
          <h2 class="font-extrabold text-lg text-slate-800">Hồ sơ chi tiết</h2>
          <div class="grid sm:grid-cols-2 gap-4 text-sm">
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Mã định danh</p>
              <p class="mt-1 font-bold text-slate-800">{{ codeOrId(u) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Vai trò</p>
              <p class="mt-1 font-bold text-slate-800">{{ roleLabel(u.role) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Email</p>
              <p class="mt-1 font-bold text-slate-800 break-all">{{ u.email || '—' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Giới tính</p>
              <p class="mt-1 font-bold text-slate-800">{{ getGenderLabel(u.gender) }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Năm sinh</p>
              <p class="mt-1 font-bold text-slate-800">{{ u.birth ?? '—' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Trường</p>
              <p class="mt-1 font-bold text-slate-800">{{ u.school || '—' }}</p>
            </div>
            <div class="rounded-xl bg-slate-50 px-4 py-3">
              <p class="text-xs font-bold uppercase text-slate-500 tracking-wide">Trạng thái</p>
              <p class="mt-1 font-bold text-slate-800">{{ u.isActive ? 'Đang hoạt động' : 'Đã khóa' }}</p>
            </div>
          </div>

          @if (u.role === userRole.Student || u.role === userRole.Tutor) {
            <div class="rounded-xl bg-blue-50 border-2 border-blue-100 px-4 py-3 text-sm text-slate-700">
              Để xem hồ sơ {{ u.role === userRole.Tutor ? 'gia sư' : 'học viên' }} đầy đủ (môn dạy, học phí, địa chỉ, …),
              truy cập trang công khai
              <span class="font-bold font-mono">{{ u.role === userRole.Tutor ? '/tutors' : '/students' }}</span>.
            </div>
          }
        </div>
      } @else if (!errorDetails()) {
        <div class="tactile-card p-8 text-center font-bold text-slate-500">Đang tải...</div>
      }
    </div>
  `,
})
export class AdminUserDetailPage implements OnInit {
  user = signal<UserDto | null>(null);
  errorDetails = signal<ApiErrorDetails | null>(null);
  actionError = signal('');
  isDeleting = signal(false);

  protected readonly userRole = UserRole;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly usersApi = inject(UsersService);
  private readonly session = inject(SessionService);

  ngOnInit(): void {
    void this.loadUser();
  }

  initials(name?: string | null): string {
    if (!name) return '?';
    return name.split(' ').slice(-2).map((s) => s[0]).join('').toUpperCase();
  }

  roleLabel(role?: UserRole | null): string {
    return userRoleLabel(role);
  }

  getGenderLabel(gender?: string | null): string {
    return genderLabel(gender);
  }

  subtitle(user: UserDto): string {
    return this.codeOrId(user);
  }

  codeOrId(user: UserDto): string {
    const code = (user as { code?: string | null }).code;
    if (code) return code;
    if (user.role === UserRole.Admin) return `Quản trị viên #${user.id}`;
    return `Người dùng #${user.id}`;
  }

  canDelete(): boolean {
    const u = this.user();
    if (!u?.id) return false;
    return u.id !== this.session.user()?.id;
  }

  async confirmDelete(): Promise<void> {
    const u = this.user();
    if (!u?.id) return;
    const confirmed = window.confirm(
      `Xác nhận xóa người dùng "${u.fullName || u.email}"? Thao tác này không thể hoàn tác.`,
    );
    if (!confirmed) return;
    this.isDeleting.set(true);
    this.actionError.set('');
    try {
      await firstValueFrom(this.usersApi.deleteUser(u.id));
      await this.router.navigateByUrl('/admin/users');
    } catch (error) {
      console.error('[admin/user-detail] delete failed', error);
      this.actionError.set(getApiErrorMessage(error, 'Không xóa được người dùng.'));
    } finally {
      this.isDeleting.set(false);
    }
  }

  private async loadUser(): Promise<void> {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.errorDetails.set({ message: 'ID người dùng không hợp lệ.' });
      return;
    }
    try {
      const response = await firstValueFrom(this.usersApi.getUserById(id));
      this.user.set(response.data ?? null);
    } catch (error) {
      console.error('[admin/user-detail] load failed', error);
      this.errorDetails.set(getApiErrorDetails(error, 'Không tải được thông tin người dùng.'));
    }
  }
}
