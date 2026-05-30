import {
  AcademicDegree,
  ApplicationStatus,
  CancellationRequestStatus,
  ClassStatus,
  EducationLevel,
  Gender,
  Grade,
  LearningRequestStatus,
  NotificationDto,
  PaymentStatus,
  ScheduleProposalStatus,
  TimeSlotDto,
  TimeSlotInputDto,
  TutorCareerStatus,
  TutorRequestStatus,
  UserRole,
} from '../../api/generated/client/models';

export const DAY_OPTIONS = [
  { value: 'Monday', label: 'Thứ 2', weekend: false },
  { value: 'Tuesday', label: 'Thứ 3', weekend: false },
  { value: 'Wednesday', label: 'Thứ 4', weekend: false },
  { value: 'Thursday', label: 'Thứ 5', weekend: false },
  { value: 'Friday', label: 'Thứ 6', weekend: false },
  { value: 'Saturday', label: 'Thứ 7', weekend: true },
  { value: 'Sunday', label: 'Chủ nhật', weekend: true },
] as const;

export function formatMoney(value?: number | null): string {
  return new Intl.NumberFormat('vi-VN').format(value ?? 0) + 'đ';
}

export function formatDate(value?: Date | string | null): string {
  if (!value) return 'Chưa có';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Chưa có';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value?: Date | string | null): string {
  if (!value) return 'Chưa có';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'Chưa có';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

export function formatTimeSlots(slots?: TimeSlotDto[] | TimeSlotInputDto[] | null): string {
  if (!slots?.length) return 'Chưa có lịch';

  return slots
    .map((slot) => {
      const day = DAY_OPTIONS.find((item) => item.value === slot.day)?.label ?? slot.day;
      return `${day} ${slot.startTime}-${slot.endTime}`;
    })
    .join(', ');
}

export function learningRequestStatusLabel(status?: LearningRequestStatus | null): string {
  const labels: Record<LearningRequestStatus, string> = {
    [LearningRequestStatus.Pending]: 'Đang chờ gia sư phản hồi',
    [LearningRequestStatus.Negotiating]: 'Gia sư đã đề xuất lịch mới',
    [LearningRequestStatus.SoftBooked]: 'Đã giữ chỗ, cần thanh toán',
    [LearningRequestStatus.TutorRejected]: 'Gia sư đã từ chối',
    [LearningRequestStatus.StudentRejected]: 'Bạn đã từ chối đề xuất',
    [LearningRequestStatus.ScheduleExpired]: 'Hết hạn phản hồi lịch',
    [LearningRequestStatus.PaymentExpired]: 'Hết hạn thanh toán',
    [LearningRequestStatus.ConvertedToClass]: 'Đã thanh toán, lớp đã được tạo',
  };
  return status ? labels[status] : 'Chưa rõ trạng thái';
}

export function classStatusLabel(status?: ClassStatus | null): string {
  const labels: Record<ClassStatus, string> = {
    [ClassStatus.PendingStart]: 'Chờ ngày bắt đầu',
    [ClassStatus.Active]: 'Đang học',
    [ClassStatus.CancelledByStudent]: 'Học viên đã hủy',
    [ClassStatus.CancelledByTutor]: 'Gia sư đã hủy',
    [ClassStatus.CancelledByAdmin]: 'Admin đã hủy',
  };
  return status ? labels[status] : 'Chưa rõ trạng thái';
}

export function paymentStatusLabel(status?: PaymentStatus | null): string {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.Pending]: 'Đang chờ thanh toán',
    [PaymentStatus.Success]: 'Đã thanh toán',
    [PaymentStatus.Failed]: 'Thanh toán thất bại',
    [PaymentStatus.Cancelled]: 'Đã hủy',
  };
  return status ? labels[status] : 'Chưa rõ trạng thái';
}

export function cancellationStatusLabel(status?: CancellationRequestStatus | null): string {
  const labels: Record<CancellationRequestStatus, string> = {
    [CancellationRequestStatus.Pending]: 'Chờ xử lý',
    [CancellationRequestStatus.Resolved]: 'Đã xử lý',
  };
  return status ? labels[status] : 'Chưa rõ trạng thái';
}

export function userRoleLabel(role?: UserRole | null): string {
  const labels: Record<UserRole, string> = {
    [UserRole.Student]: 'Học viên',
    [UserRole.Tutor]: 'Gia sư',
    [UserRole.Admin]: 'Quản trị viên',
  };
  return role ? labels[role] : 'Không rõ';
}

export function academicDegreeLabel(degree?: AcademicDegree | null): string {
  const labels: Record<AcademicDegree, string> = {
    [AcademicDegree.Intermediate]: 'Trung cấp',
    [AcademicDegree.College]: 'Cao đẳng',
    [AcademicDegree.University]: 'Đại học',
  };
  return degree ? labels[degree] : 'Chưa cập nhật';
}

export function educationLevelLabel(level?: EducationLevel | null): string {
  const labels: Record<EducationLevel, string> = {
    [EducationLevel.Preschool]: 'Mầm non',
    [EducationLevel.PrimarySchool]: 'Tiểu học',
    [EducationLevel.SecondarySchool]: 'Trung học cơ sở',
    [EducationLevel.HighSchool]: 'Trung học phổ thông',
    [EducationLevel.College]: 'Cao đẳng',
    [EducationLevel.University]: 'Đại học',
  };
  return level ? labels[level] : 'Chưa cập nhật';
}

export function genderLabel(gender?: Gender | string | null): string {
  if (!gender) return 'Chưa cập nhật';
  const labels: Record<Gender, string> = {
    [Gender.Male]: 'Nam',
    [Gender.Female]: 'Nữ',
  };
  return labels[gender as Gender] ?? (gender === 'Male' || gender === 'male' ? 'Nam' : gender === 'Female' || gender === 'female' ? 'Nữ' : 'Chưa cập nhật');
}

export function gradeLabel(grade?: Grade | null): string {
  const labels: Record<Grade, string> = {
    [Grade.Grade0]: 'Mầm non',
    [Grade.Grade1]: 'Lớp 1',
    [Grade.Grade2]: 'Lớp 2',
    [Grade.Grade3]: 'Lớp 3',
    [Grade.Grade4]: 'Lớp 4',
    [Grade.Grade5]: 'Lớp 5',
    [Grade.Grade6]: 'Lớp 6',
    [Grade.Grade7]: 'Lớp 7',
    [Grade.Grade8]: 'Lớp 8',
    [Grade.Grade9]: 'Lớp 9',
    [Grade.Grade10]: 'Lớp 10',
    [Grade.Grade11]: 'Lớp 11',
    [Grade.Grade12]: 'Lớp 12',
    [Grade.University]: 'Đại học',
    [Grade.Other]: 'Khác',
  };
  return grade ? labels[grade] : 'Chưa cập nhật';
}

export function tutorCareerStatusLabel(status?: TutorCareerStatus | null): string {
  const labels: Record<TutorCareerStatus, string> = {
    [TutorCareerStatus.Student]: 'Sinh viên',
    [TutorCareerStatus.Graduated]: 'Đã tốt nghiệp',
    [TutorCareerStatus.Teacher]: 'Giáo viên',
  };
  return status ? labels[status] : 'Chưa cập nhật';
}

export function tutorRequestStatusLabel(status?: TutorRequestStatus | string | null): string {
  if (!status) return 'Chưa cập nhật';
  const labels: Record<TutorRequestStatus, string> = {
    [TutorRequestStatus.Open]: 'Đang mở',
    [TutorRequestStatus.Expired]: 'Hết hạn',
    [TutorRequestStatus.Assigned]: 'Đã nhận lớp',
    [TutorRequestStatus.Closed]: 'Đã đóng',
  };
  return labels[status as TutorRequestStatus] ?? status;
}

export function applicationStatusLabel(status?: ApplicationStatus | string | null): string {
  if (!status) return 'Chưa cập nhật';
  const labels: Record<ApplicationStatus, string> = {
    [ApplicationStatus.Pending]: 'Chờ xử lý',
    [ApplicationStatus.StudentConfirmed]: 'Học viên đã xác nhận',
    [ApplicationStatus.AdminApproved]: 'Admin đã duyệt',
    [ApplicationStatus.AdminRejected]: 'Admin đã từ chối',
    [ApplicationStatus.StudentRejected]: 'Học viên đã từ chối',
    [ApplicationStatus.AdminMatched]: 'Admin đã ghép',
    [ApplicationStatus.StudentAccepted]: 'Học viên đã chấp nhận',
    [ApplicationStatus.TutorAccepted]: 'Gia sư đã chấp nhận',
    [ApplicationStatus.BothAccepted]: 'Hai bên đã chấp nhận',
  };
  return labels[status as ApplicationStatus] ?? status;
}

export function scheduleProposalStatusLabel(status?: ScheduleProposalStatus | null): string {
  const labels: Record<ScheduleProposalStatus, string> = {
    [ScheduleProposalStatus.Pending]: 'Chờ học viên phản hồi',
    [ScheduleProposalStatus.Accepted]: 'Học viên đã chấp nhận',
    [ScheduleProposalStatus.Rejected]: 'Học viên đã từ chối',
  };
  return status ? labels[status] : 'Chưa cập nhật';
}

export function notificationRoute(notification: NotificationDto, role: UserRole = UserRole.Student): string {
  const rolePrefix = role === UserRole.Tutor ? '/tutor' : role === UserRole.Admin ? '/admin' : '/student';

  // Direct actionUrl override – used for admin/users, auth/login, etc.
  if (notification.actionUrl) {
    if (notification.actionUrl.startsWith('/learning-requests/')) {
      if (role === UserRole.Tutor) {
        const id = notification.actionUrl.split('/').pop();
        return `/tutor/requests/${id}`;
      }
      return `${rolePrefix}${notification.actionUrl}`;
    }
    // Admin tutor-profile links (/admin/users/:id)
    if (notification.actionUrl.startsWith('/admin/')) {
      return notification.actionUrl;
    }
    // Auth links (/auth/login) – just return as-is
    if (notification.actionUrl.startsWith('/auth/')) {
      return notification.actionUrl;
    }
  }

  if (notification.referenceType === 'LearningRequest' && notification.referenceId) {
    if (role === UserRole.Tutor) {
      return `/tutor/requests/${notification.referenceId}`;
    }
    return `${rolePrefix}/learning-requests/${notification.referenceId}`;
  }

  if (notification.referenceType === 'Class' && notification.referenceId) {
    return `${rolePrefix}/classes/${notification.referenceId}`;
  }

  // Tutor registration / approval – admin goes to user list, tutor sees their profile
  if (notification.referenceType === 'Tutor') {
    if (role === UserRole.Admin) {
      return `/admin/users`;
    }
  }

  return `${rolePrefix}/notifications`;
}

export function buildEndTime(startTime: string, hoursPerSession: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + Math.round(hoursPerSession * 60);
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
}

export function validateTimeSlots(slots: TimeSlotInputDto[], hoursPerSession: number): string | null {
  if (!slots.length) return 'Vui lòng chọn ít nhất một lịch học.';
  if (hoursPerSession < 0.5 || hoursPerSession > 3 || hoursPerSession % 0.5 !== 0) {
    return 'Số giờ mỗi buổi phải từ 0.5 đến 3 và theo bước 0.5.';
  }

  const intervalsByDay = new Map<string, Array<[number, number]>>();

  for (const slot of slots) {
    const day = DAY_OPTIONS.find((item) => item.value === slot.day);
    if (!day) return 'Ngày học không hợp lệ.';

    const start = toMinutes(slot.startTime);
    const end = toMinutes(slot.endTime);
    const minStart = day.weekend ? toMinutes('08:00') : toMinutes('17:00');
    const maxEnd = toMinutes('22:30');

    if (end !== start + Math.round(hoursPerSession * 60)) {
      return 'Giờ kết thúc phải bằng giờ bắt đầu cộng số giờ mỗi buổi.';
    }

    if (start < minStart) {
      return day.weekend ? 'Cuối tuần chỉ bắt đầu từ 08:00.' : 'Ngày thường chỉ bắt đầu từ 17:00.';
    }

    if (end > maxEnd) {
      return 'Lịch học không được kết thúc sau 22:30.';
    }

    const intervals = intervalsByDay.get(slot.day) ?? [];
    if (intervals.some(([existingStart, existingEnd]) => start < existingEnd && end > existingStart)) {
      return 'Các lịch học trong cùng ngày không được trùng nhau.';
    }
    intervals.push([start, end]);
    intervalsByDay.set(slot.day, intervals);
  }

  return null;
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getStartTimeOptions(dayValue: string): string[] {
  const isWeekend = dayValue === 'Saturday' || dayValue === 'Sunday';
  const startHour = isWeekend ? 8 : 17;
  const options: string[] = [];
  for (let h = startHour; h <= 22; h++) {
    const hh = String(h).padStart(2, '0');
    options.push(`${hh}:00`);
    if (h < 22) {
      options.push(`${hh}:30`);
    }
  }
  return options;
}

export function learningRequestStatusClass(status?: LearningRequestStatus | null): string {
  if (!status) return 'bg-slate-50 text-slate-500 border-slate-200';
  const classes: Record<LearningRequestStatus, string> = {
    [LearningRequestStatus.Pending]: 'bg-yellow-50 text-duo-yellow-dark border-yellow-100',
    [LearningRequestStatus.Negotiating]: 'bg-orange-50 text-duo-orange border-orange-100',
    [LearningRequestStatus.SoftBooked]: 'bg-blue-50 text-duo-blue border-blue-100',
    [LearningRequestStatus.ConvertedToClass]: 'bg-green-50 text-duo-green border-green-100',
    [LearningRequestStatus.TutorRejected]: 'bg-red-50 text-duo-red border-red-100',
    [LearningRequestStatus.StudentRejected]: 'bg-red-50 text-duo-red border-red-100',
    [LearningRequestStatus.ScheduleExpired]: 'bg-slate-100 text-slate-500 border-slate-200',
    [LearningRequestStatus.PaymentExpired]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return `border ${classes[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`;
}

export function classStatusClass(status?: ClassStatus | null): string {
  if (!status) return 'bg-slate-50 text-slate-500 border-slate-200';
  const classes: Record<ClassStatus, string> = {
    [ClassStatus.PendingStart]: 'bg-blue-50 text-duo-blue border-blue-100',
    [ClassStatus.Active]: 'bg-green-50 text-duo-green border-green-100',
    [ClassStatus.CancelledByStudent]: 'bg-red-50 text-duo-red border-red-100',
    [ClassStatus.CancelledByTutor]: 'bg-red-50 text-duo-red border-red-100',
    [ClassStatus.CancelledByAdmin]: 'bg-red-50 text-duo-red border-red-100',
  };
  return `border ${classes[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`;
}

export function paymentStatusClass(status?: PaymentStatus | null): string {
  if (!status) return 'bg-slate-50 text-slate-500 border-slate-200';
  const classes: Record<PaymentStatus, string> = {
    [PaymentStatus.Pending]: 'bg-yellow-50 text-duo-yellow-dark border-yellow-100',
    [PaymentStatus.Success]: 'bg-green-50 text-duo-green border-green-100',
    [PaymentStatus.Failed]: 'bg-red-50 text-duo-red border-red-100',
    [PaymentStatus.Cancelled]: 'bg-slate-100 text-slate-500 border-slate-200',
  };
  return `border ${classes[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`;
}

export function cancellationStatusClass(status?: CancellationRequestStatus | null): string {
  if (!status) return 'bg-slate-50 text-slate-500 border-slate-200';
  const classes: Record<CancellationRequestStatus, string> = {
    [CancellationRequestStatus.Pending]: 'bg-orange-50 text-duo-orange border-orange-100',
    [CancellationRequestStatus.Resolved]: 'bg-green-50 text-duo-green border-green-100',
  };
  return `border ${classes[status] || 'bg-slate-50 text-slate-500 border-slate-200'}`;
}


