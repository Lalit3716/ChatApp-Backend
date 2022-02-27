import { Controller, Get, Param } from '@nestjs/common';
import { ChatDocument } from './schemas/chat.schema';
import { ChatService } from './chat.service';

@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get(':roomId')
  async findAll(@Param('roomId') roomId: string): Promise<ChatDocument[]> {
    return await this.chatService.findAll(roomId);
  }
}
