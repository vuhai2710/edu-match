using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs
{
    public class BaseQueryParameters
    {
        private const int MaxPageSize = 100;
        private int _pageSize = 10;

        [FromQuery(Name = "page")]
        [Range(1, int.MaxValue, ErrorMessage = "Page number must be greater than 0.")]
        public int Page { get; set; } = 1;

        [FromQuery(Name = "pageSize")]
        [Range(1, int.MaxValue, ErrorMessage = "Page size must be greater than 0.")]
        public int PageSize
        {
            get => _pageSize;
            set => _pageSize = (value > MaxPageSize) ? MaxPageSize : value;
        }

        [FromQuery(Name = "searchTerm")]
        public string? SearchTerm { get; set; }

        [FromQuery(Name = "sortColumn")]
        public string? SortColumn { get; set; }

        [FromQuery(Name = "sortDirection")]
        public string? SortDirection { get; set; } = "asc";
    }
}
