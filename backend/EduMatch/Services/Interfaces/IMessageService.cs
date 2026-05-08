using EduMatch.DTOs.Chat;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EduMatch.Services.Interfaces
{
  public interface IMessageService
  {
    Task<MessageDto> SaveMessageAsync(long senderId, SendMessageDto dto);
    Task<List<MessageDto>> GetConversationAsync(long userId, long partnerId, int page, int pageSize);
    Task<List<ConversationSummaryDto>> GetConversationListAsync(long userId);
    Task MarkAsReadAsync(long userId, long partnerId);
  }
}
