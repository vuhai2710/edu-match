using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs
{
    public class BaseQueryParameters
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;

        [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0.")]
        public int PageNumber { get; set; } = 1;

        [Range(1, int.MaxValue, ErrorMessage = "Page size must be greater than 0.")]
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }

        public string? SearchTerm { get; set; }

        public string? SortColumn { get; set; }

        public string? SortDirection { get; set; } = "asc";
    }
}
