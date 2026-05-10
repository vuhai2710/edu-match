using System;
using EduMatch.Common.Enums;

namespace EduMatch.Models
{
    public class Class : BaseEntity
    {
        public string Code { get; set; } = null!;
        public long StudentId { get; set; }
        public User Student { get; set; } = null!;

        public long TutorId { get; set; }
        public Tutor Tutor { get; set; } = null!;

        public long RequestId { get; set; }
        public TutorRequest Request { get; set; } = null!;

        public long ApplicationId { get; set; }
        public Application Application { get; set; } = null!;

        public decimal DepositAmount { get; set; }
        
        public ClassStatus Status { get; set; } = ClassStatus.PendingPayment;

        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }
}