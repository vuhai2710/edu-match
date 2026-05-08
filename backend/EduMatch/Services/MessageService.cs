using AutoMapper;
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
      var conversations = await _db.Messages
          .Where(m => !m.IsDeleted && (m.SenderId == userId || m.ReceiverId == userId))
          .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
          .Select(g => new
          {
            PartnerId = g.Key,
            LastMessage = g.OrderByDescending(x => x.CreatedAt).First(),
            UnreadCount = g.Count(x => x.ReceiverId == userId && !x.IsRead)
          })
          .ToListAsync();

      var partnerIds = conversations.Select(c => c.PartnerId).ToList();
      var partners = await _db.Users
          .Where(u => partnerIds.Contains(u.Id))
          .ToDictionaryAsync(u => u.Id);

      return conversations
          .OrderByDescending(c => c.LastMessage.CreatedAt)
          .Select(c => new ConversationSummaryDto
          {
            PartnerId = c.PartnerId,
            PartnerName = partners[c.PartnerId].FullName,
            PartnerAvatar = partners[c.PartnerId].AvatarFile?.FilePath,
            PartnerRole = partners[c.PartnerId].Role.ToString(),
            LastMessage = c.LastMessage.Content,
            LastMessageAt = c.LastMessage.CreatedAt,
            UnreadCount = c.UnreadCount
          })
          .ToList();
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
