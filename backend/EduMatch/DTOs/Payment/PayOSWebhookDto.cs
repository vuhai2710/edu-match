namespace EduMatch.DTOs.Payment
{
    public class WebhookData
    {
        public long OrderCode { get; set; }
        public decimal Amount { get; set; }
        public string Description { get; set; } = default!;
        public string AccountNumber { get; set; } = default!;
        public string Reference { get; set; } = default!;
        public string TransactionDateTime { get; set; } = default!;
        public string Currency { get; set; } = default!;
        public string PaymentLinkId { get; set; } = default!;
        public string Code { get; set; } = default!;
        public string Desc { get; set; } = default!;
        public string CounterAccountBankId { get; set; } = default!;
        public string CounterAccountBankName { get; set; } = default!;
        public string CounterAccountName { get; set; } = default!;
        public string CounterAccountNumber { get; set; } = default!;
        public string VirtualAccountName { get; set; } = default!;
        public string VirtualAccountNumber { get; set; } = default!;
    }

    public class PayOSWebhookDto
    {
        public string Code { get; set; } = default!;
        public string Desc { get; set; } = default!;
        public WebhookData Data { get; set; } = default!;
        public string Signature { get; set; } = default!;
    }
}