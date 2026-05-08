using EduMatch.DTOs;
using EduMatch.DTOs.Chat;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize]
  public class ChatController : ControllerBase
  {
    private readonly IMessageService _messageService;

    public ChatController(IMessageService messageService)
    {
      _messageService = messageService;
    }

    [HttpGet("conversations")]
    [ProducesResponseType(typeof(ApiResponse<List<ConversationSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ConversationSummaryDto>>>> GetConversations()
    {
      var userId = GetUserId();
      var result = await _messageService.GetConversationListAsync(userId);
      return Ok(ApiResponse<List<ConversationSummaryDto>>.SuccessResult(result));
    }

    [HttpGet("history/{partnerId}")]
    [ProducesResponseType(typeof(ApiResponse<List<MessageDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<MessageDto>>>> GetHistory(
        long partnerId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 30)
    {
      var userId = GetUserId();
      var messages = await _messageService.GetConversationAsync(userId, partnerId, page, pageSize);
      messages.Reverse(); 
      return Ok(ApiResponse<List<MessageDto>>.SuccessResult(messages));
    }

    private long GetUserId()
    {
      var claim = User.FindFirst("userId");
      if (claim == null)
      {
        throw new System.Exception("User ID not found in claims.");
      }
      return long.Parse(claim.Value);
    }
  }
}
