using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs.Chat;
using EduMatch.Models;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class MessageService : IMessageService
  {
    private readonly AppDbContext _db;
    private readonly IMapper _mapper;

    public MessageService(AppDbContext db, IMapper mapper)
    {
      _db = db;
      _mapper = mapper;
    }

    public async Task<MessageDto> SaveMessageAsync(long senderId, SendMessageDto dto)
    {
      var msg = new Message
      {
        SenderId = senderId,
        ReceiverId = dto.ReceiverId,
        Content = dto.Content,
        IsRead = false,
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
      };
      _db.Messages.Add(msg);
      await _db.SaveChangesAsync();

      await _db.Entry(msg).Reference(m => m.Sender).LoadAsync();
      await _db.Entry(msg).Reference(m => m.Receiver).LoadAsync();

      return MapToDto(msg);
    }

    public async Task<List<MessageDto>> GetConversationAsync(
        long userId, long partnerId, int page = 1, int pageSize = 30)
    {
      return await _db.Messages
          .Where(m => !m.IsDeleted &&
              ((m.SenderId == userId && m.ReceiverId == partnerId) ||
               (m.SenderId == partnerId && m.ReceiverId == userId)))
          .OrderByDescending(m => m.CreatedAt)
          .Skip((page - 1) * pageSize)
          .Take(pageSize)
          .Include(m => m.Sender)
          .Include(m => m.Receiver)
          .Select(m => MapToDto(m))
          .ToListAsync();
    }

    public async Task<List<ConversationSummaryDto>> GetConversationListAsync(long userId)
    {
      var messageSummaries = _db.Messages
          .AsNoTracking()
          .Where(m => !m.IsDeleted && (m.SenderId == userId || m.ReceiverId == userId))
          .Select(m => new
          {
            PartnerId = m.SenderId == userId ? m.ReceiverId : m.SenderId,
            m.Id,
            m.Content,
            m.CreatedAt,
            m.ReceiverId,
            m.IsRead
          });

      var conversations = await messageSummaries
          .GroupBy(m => m.PartnerId)
          .Select(g => new
          {
            PartnerId = g.Key,
            LastMessageAt = g.Max(x => x.CreatedAt),
            UnreadCount = g.Count(x => x.ReceiverId == userId && !x.IsRead)
          })
          .ToListAsync();

      var currentUser = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);
      if (currentUser != null && currentUser.Role != UserRole.Admin)
      {
        var admin = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
        if (admin != null)
        {
          var hasAdmin = conversations.Any(c => c.PartnerId == admin.Id);
          if (!hasAdmin)
          {
            conversations.Add(new
            {
              PartnerId = admin.Id,
              LastMessageAt = currentUser.CreatedAt,
              UnreadCount = 0
            });
          }
        }
      }

      var partnerIds = conversations.Select(c => c.PartnerId).ToList();

      if (partnerIds.Count == 0)
      {
        return [];
      }

      var latestMessages = await messageSummaries
          .Where(m => partnerIds.Contains(m.PartnerId))
          .OrderByDescending(m => m.CreatedAt)
          .ThenByDescending(m => m.Id)
          .ToListAsync();

      var latestMessageByPartnerId = latestMessages
          .GroupBy(m => m.PartnerId)
          .ToDictionary(g => g.Key, g => g.First());

      var partners = await _db.Users
          .AsNoTracking()
          .Where(u => partnerIds.Contains(u.Id))
          .Select(u => new
          {
            u.Id,
            u.FullName,
            AvatarPath = u.AvatarFile != null ? u.AvatarFile.FilePath : null,
            u.Role,
            Code = u.Student != null ? u.Student.Code : (u.Tutor != null ? u.Tutor.Code : null)
          })
          .ToDictionaryAsync(
            u => u.Id,
            u => new
            {
              u.FullName,
              u.AvatarPath,
              Role = u.Role.ToString(),
              u.Code
            });

      return conversations
          .OrderByDescending(c => c.LastMessageAt)
          .ThenByDescending(c => latestMessageByPartnerId.TryGetValue(c.PartnerId, out var lm) ? lm.Id : 0)
          .Select(c =>
          {
            var partner = partners.ContainsKey(c.PartnerId) ? partners[c.PartnerId] : null;
            if (partner == null) return null!;

            var hasMsg = latestMessageByPartnerId.TryGetValue(c.PartnerId, out var msg);
            return new ConversationSummaryDto
            {
              PartnerId = c.PartnerId,
              PartnerName = partner.FullName,
              PartnerAvatar = partner.AvatarPath,
              PartnerRole = partner.Role,
              PartnerCode = partner.Code,
              LastMessage = hasMsg ? msg.Content : (partner.Role == "Admin" ? "Hỗ trợ trực tuyến / Quản trị viên" : "Chưa có tin nhắn"),
              LastMessageAt = hasMsg ? msg.CreatedAt : c.LastMessageAt,
              UnreadCount = c.UnreadCount
            };
          })
          .Where(c => c != null)
          .Cast<ConversationSummaryDto>()
          .ToList();
    }

    public Task<int> GetUnreadCountAsync(long userId)
    {
      return _db.Messages
        .AsNoTracking()
        .CountAsync(m => m.ReceiverId == userId && !m.IsRead && !m.IsDeleted);
    }

    public async Task MarkAsReadAsync(long userId, long partnerId)
    {
      var unread = await _db.Messages
          .Where(m => m.SenderId == partnerId && m.ReceiverId == userId && !m.IsRead)
          .ToListAsync();

      unread.ForEach(m => m.IsRead = true);
      await _db.SaveChangesAsync();
    }

    private static MessageDto MapToDto(Message m) => new MessageDto
    {
      Id = m.Id,
      SenderId = m.SenderId,
      SenderName = m.Sender?.FullName ?? "",
      SenderAvatar = m.Sender?.AvatarFile?.FilePath,
      ReceiverId = m.ReceiverId,
      ReceiverName = m.Receiver?.FullName ?? "",
      Content = m.Content,
      IsRead = m.IsRead,
      CreatedAt = m.CreatedAt
    };
  }
}
