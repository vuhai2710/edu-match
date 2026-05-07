using EduMatch.DTOs.Address;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Net;
using System.Text.Json;

namespace EduMatch.Services
{
  public class AddressService : IAddressService
  {
    private const string DefaultAddressApiBaseUrl = "https://provinces.open-api.vn/api/v2/";
    private static readonly TimeSpan AddressCacheDuration = TimeSpan.FromHours(24);

    private readonly HttpClient _httpClient;
    private readonly IMemoryCache _cache;
    private readonly ILogger<AddressService> _logger;

    private const string ProvincesCacheKey = "address_provinces";
    private static string WardsCacheKey(int provinceId) => $"address_wards_{provinceId}";

    public AddressService(HttpClient httpClient, IMemoryCache cache, ILogger<AddressService> logger)
    {
      _httpClient = httpClient;
      _cache = cache;
      _logger = logger;

      _httpClient.BaseAddress ??= new Uri(DefaultAddressApiBaseUrl);
    }

    public async Task<List<ProvinceDto>> GetProvincesAsync(CancellationToken ct = default)
    {
      if (_cache.TryGetValue(ProvincesCacheKey, out List<ProvinceDto>? cachedProvinces) && cachedProvinces != null)
      {
        return cachedProvinces;
      }

      var response = await GetFromAddressApiAsync<List<ProvinceApiResponse>>("p/", "provinces", ct);
      var provinces = response?
        .Where(p => p.Code > 0 && !string.IsNullOrWhiteSpace(p.Name))
        .Select(p => new ProvinceDto
        {
          ProvinceId = p.Code,
          ProvinceName = p.Name
        })
        .ToList() ?? new List<ProvinceDto>();

      if (provinces.Count > 0)
      {
        _cache.Set(ProvincesCacheKey, provinces, AddressCacheDuration);
      }

      return provinces;
    }

    public async Task<List<WardDto>> GetWardsAsync(int provinceId, CancellationToken ct = default)
    {
      var cacheKey = WardsCacheKey(provinceId);
      if (_cache.TryGetValue(cacheKey, out List<WardDto>? cachedWards) && cachedWards != null)
      {
        return cachedWards;
      }

      var province = await GetFromAddressApiAsync<ProvinceApiResponse>($"p/{provinceId}?depth=2", $"province {provinceId}", ct);
      var wards = province?.Wards?
        .Where(IsValidWard)
        .Select(MapWard)
        .ToList() ?? new List<WardDto>();

      if (wards.Count > 0)
      {
        _cache.Set(cacheKey, wards, AddressCacheDuration);
      }

      return wards;
    }

    private async Task<T?> GetFromAddressApiAsync<T>(
      string requestUri,
      string resourceName,
      CancellationToken ct)
    {
      try
      {
        using var response = await _httpClient.GetAsync(requestUri, ct);

        if (response.StatusCode == HttpStatusCode.NotFound)
        {
          _logger.LogWarning(
            "Address API returned 404 for {ResourceName}. Request: {RequestUri}",
            resourceName,
            requestUri);
          return default;
        }

        if (!response.IsSuccessStatusCode)
        {
          var responseBody = await response.Content.ReadAsStringAsync(ct);
          _logger.LogError(
            "Address API request failed for {ResourceName}. StatusCode: {StatusCode}. Request: {RequestUri}. Response: {ResponseBody}",
            resourceName,
            (int)response.StatusCode,
            requestUri,
            responseBody);
          return default;
        }

        var payload = await response.Content.ReadFromJsonAsync<T>(cancellationToken: ct);
        if (payload == null)
        {
          _logger.LogWarning(
            "Address API returned an empty payload for {ResourceName}. Request: {RequestUri}",
            resourceName,
            requestUri);
        }

        return payload;
      }
      catch (OperationCanceledException) when (ct.IsCancellationRequested)
      {
        throw;
      }
      catch (System.Exception ex) when (ex is HttpRequestException or JsonException or NotSupportedException or TaskCanceledException)
      {
        _logger.LogError(ex, "Address API request threw for {ResourceName}. Request: {RequestUri}", resourceName, requestUri);
        return default;
      }
    }

    private static WardDto MapWard(WardApiResponse ward)
    {
      return new WardDto
      {
        WardCode = ward.Code.ToString(),
        WardName = ward.Name
      };
    }

    private static bool IsValidWard(WardApiResponse? ward)
    {
      return ward != null && ward.Code > 0 && !string.IsNullOrWhiteSpace(ward.Name);
    }
  }
}
