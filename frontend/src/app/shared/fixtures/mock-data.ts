import { ActivityClass, NotificationItem, Review, Tutor } from '../models/app.models';
import { MASCOT_URLS } from './mascot-urls';

export const INITIAL_TUTORS: Tutor[] = [
  { id: 'tutor-minh-anh', name: 'Nguyễn Minh Anh', avatar: MASCOT_URLS.femaleTutorMinhAnh, rating: 4.9, subject: 'Toán học', subjects: ['Toán học', 'Tiếng Anh', 'Vật lý'], hourlyRate: 250000, experienceYears: 3, experience: '3 năm kinh nghiệm làm gia sư trường Chuyên Lê Hồng Phong.', location: 'Quận 1, TP. Hồ Chí Minh (Hỗ trợ Online & Offline)', bio: 'Chào bạn! Mình là Minh Anh, tốt nghiệp loại Giỏi Sư phạm Toán.', isTop: true },
  { id: 'tutor-hoang-long', name: 'Trần Hoàng Long', avatar: MASCOT_URLS.tutorHeadshotGeometric, rating: 4.8, subject: 'Lập trình', subjects: ['Lập trình', 'Toán học'], hourlyRate: 300000, experienceYears: 4, experience: 'Kỹ sư phần mềm Fullstack, cựu sinh viên Bách Khoa.', location: 'Cầu Giấy, Hà Nội (Dạy trực tuyến)', bio: 'Hãy cùng Long chinh phục thế giới lập trình từ con số 0!', isTop: false },
  { id: 'tutor-thanh-thao', name: 'Lê Thanh Thảo', avatar: MASCOT_URLS.tutorMinhTriet, rating: 4.7, subject: 'Ngữ văn', subjects: ['Ngữ văn', 'Tiếng Anh'], hourlyRate: 200000, experienceYears: 2, experience: 'Tốt nghiệp ĐH KHXH&NV, 2 năm luyện thi THPT QG môn Văn.', location: 'Quận Hải Châu, Đà Nẵng', bio: 'Văn học là cuộc sống. Thảo giúp các bạn giải mã cách lập luận chặt chẽ.', isTop: false },
  { id: 'tutor-duc-huy', name: 'Phạm Đức Huy', avatar: MASCOT_URLS.tutorHeadshotGeometric, rating: 4.9, subject: 'Vật lý', subjects: ['Vật lý', 'Toán học'], hourlyRate: 220000, experienceYears: 5, experience: 'Thạc sĩ Vật lý Lý thuyết ĐH Sư phạm Hà Nội.', location: 'Hai Bà Trưng, Hà Nội (Hỗ trợ Online & Offline)', bio: 'Vật lý không hề khô khan nếu liên hệ thực tế.', isTop: true },
  { id: 'tutor-huong-giang', name: 'Trần Hương Giang', avatar: MASCOT_URLS.femaleTutorMinhAnh, rating: 4.85, subject: 'Tiếng Anh', subjects: ['Tiếng Anh', 'Ngữ văn'], hourlyRate: 180000, experienceYears: 4, experience: '8.0 IELTS, Cử nhân Ngôn ngữ Anh ĐH Ngoại thương.', location: 'Quận 3, TP. Hồ Chí Minh (Hỗ trợ Online)', bio: 'Cam kết tiến bộ rõ rệt chỉ sau 10 buổi học!', isTop: false },
  { id: 'tutor-hoai-nam', name: 'Thầy Hoài Nam', avatar: MASCOT_URLS.tutorMinhTriet, rating: 4.95, subject: 'Vật lý', subjects: ['Vật lý', 'Toán học'], hourlyRate: 260000, experienceYears: 7, experience: 'Giảng viên chuyên ngành Cơ kỹ thuật, 7 năm bồi dưỡng HSG.', location: 'Quận Liên Chiểu, Đà Nẵng (Dạy trực tuyến)', bio: 'Không áp lực - Chỉ có sự thấu hiểu.', isTop: true },
];

export const INITIAL_CLASSES: ActivityClass[] = [
  { id: 'class-1', title: 'Toán học lớp 12', tutorName: 'Nguyễn Minh Anh', timeString: 'Chờ phản hồi lập lịch', status: 'waiting' },
  { id: 'class-2', title: 'Lớp Tiếng Anh Giao tiếp', tutorName: 'Lê Thanh Thảo', timeString: 'Chờ thanh toán', status: 'pending_payment', countdownSeconds: 86395 },
  { id: 'class-3', title: 'Vật lý - Thầy Nam', tutorName: 'Thầy Hoài Nam', timeString: 'Hôm nay, 19:00', status: 'online' },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 'noti-1', title: 'Gia sư đã chấp nhận yêu cầu của bạn!', description: 'Nguyễn Minh Anh đã chấp nhận lịch dạy thử cho môn Toán 12. Vui lòng thanh toán đặt cọc.', category: 'action', isUnread: true, timeAgo: '5 phút trước' },
  { id: 'noti-2', title: 'Lớp Vật lý sắp bắt đầu!', description: 'Lớp học với Thầy Hoài Nam sẽ bắt đầu trong 10 phút nữa.', category: 'action', isUnread: true, timeAgo: '10 phút trước' },
  { id: 'noti-3', title: 'Tính năng "Nhiệm Vụ Hàng Ngày" đã ra mắt!', description: 'Hoàn thành lớp học đều đặn để nhận 500 XP điểm thưởng.', category: 'news', isUnread: false, timeAgo: '2 giờ trước' },
  { id: 'noti-4', title: 'Cập nhật chính sách hoàn tiền cọc', description: 'Hoàn trả 100% tiền cọc nếu gia sư hủy lịch trước 12 tiếng.', category: 'system', isUnread: false, timeAgo: '1 ngày trước' },
];

export const DETAILED_REVIEWS: Review[] = [
  { id: 'rev-1', name: 'Trần Anh Dũng', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80&q=80', rating: 5, comment: 'Cô Minh Anh giảng dạy siêu tận tâm! Môn Toán không còn là nỗi ám ảnh.' },
  { id: 'rev-2', name: 'Phạm Quỳnh Vy', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&h=80&q=80', rating: 5, comment: 'Điểm thi từ 6 lên 8.5 sau 2 tháng. Đỉnh của chóp!' },
  { id: 'rev-3', name: 'Nguyễn Hoàng Nam', avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=80&h=80&q=80', rating: 4.8, comment: 'Bài giảng chuẩn bị công phu, nhiều bài tập hay.' },
];
