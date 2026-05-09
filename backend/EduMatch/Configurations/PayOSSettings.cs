namespace EduMatch.Configurations
{
    public class PayOSSettings
    {
        public string ClientId { get; set; } = default!;
        public string ApiKey { get; set; } = default!;
        public string ChecksumKey { get; set; } = default!;
        public string BaseUrl { get; set; } = "https://api-merchant.payos.vn";
        public string ReturnUrl { get; set; } = default!;
        public string CancelUrl { get; set; } = default!;
    }
}