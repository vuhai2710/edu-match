using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EduMatch.Common.Enums;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum NotificationType
{
  [Display(Name = "Don ung tuyen moi")]
  ApplicationCreated,

  [Display(Name = "Don ung tuyen duoc duyet")]
  ApplicationApproved,

  [Display(Name = "Don ung tuyen bi tu choi")]
  ApplicationRejected,

  [Display(Name = "Hoc vien da xac nhan")]
  StudentConfirmed,

  [Display(Name = "Hoc vien da tu choi")]
  StudentRejected,

  [Display(Name = "Admin da ghep lop")]
  AdminMatched,

  [Display(Name = "Ghep lop duoc chap nhan")]
  MatchAccepted,

  [Display(Name = "Yeu cau tim gia su moi")]
  TutorRequestCreated,

  [Display(Name = "Tin nhan moi")]
  NewMessage,

  [Display(Name = "Thanh toan moi")]
  PaymentCreated,

  [Display(Name = "Thanh toan thanh cong")]
  PaymentSuccess,

  [Display(Name = "Danh gia moi")]
  ReviewCreated,

  [Display(Name = "Yeu cau tro thanh gia su")]
  BecomeTutorRequest,

  [Display(Name = "Gia su duoc duyet")]
  TutorApproved,

  [Display(Name = "Gia su bi tu choi")]
  TutorRejected,

  [Display(Name = "Yeu cau hoc tap da duoc tao")]
  LearningRequestCreated,

  [Display(Name = "Gia su chap nhan yeu cau")]
  LearningRequestAccepted,

  [Display(Name = "Gia su tu choi yeu cau")]
  LearningRequestRejected,

  [Display(Name = "Gia su da de xuat lich hoc moi")]
  ScheduleProposalCreated,

  [Display(Name = "Hoc vien da chap nhan de xuat lich hoc")]
  ScheduleProposalAccepted,

  [Display(Name = "Hoc vien da tu choi de xuat lich hoc")]
  ScheduleProposalRejected,

  [Display(Name = "Yeu cau thanh toan dat coc")]
  DepositPaymentCreated,

  [Display(Name = "Thanh toan dat coc thanh cong")]
  DepositPaymentSuccess,

  [Display(Name = "Lop hoc da duoc tao")]
  ClassCreated,

  [Display(Name = "Yeu cau het han lich")]
  LearningRequestScheduleExpired,

  [Display(Name = "Yeu cau het han thanh toan")]
  LearningRequestPaymentExpired,

  [Display(Name = "Lop hoc da bat dau")]
  ClassActivated,

  [Display(Name = "Yeu cau huy lop da duoc tao")]
  CancellationRequestCreated,

  [Display(Name = "Yeu cau huy lop da duoc xu ly")]
  CancellationRequestResolved,

  [Display(Name = "Lop hoc da bi huy")]
  ClassCancelled,

  [Display(Name = "Yeu cau hoan thanh lop da duoc tao")]
  ClassCompletionRequested,

  [Display(Name = "Yeu cau hoan thanh lop da duoc xac nhan")]
  ClassCompletionConfirmed,

  [Display(Name = "Yeu cau hoan thanh lop bi tu choi")]
  ClassCompletionRejected,

  [Display(Name = "Lop hoc da hoan thanh")]
  ClassCompleted
}
