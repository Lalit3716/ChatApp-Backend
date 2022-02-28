import {
  Controller,
  Get,
  Param,
  Request,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ChatDocument } from './schemas/chat.schema';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('chats')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':roomId')
  async findAll(
    @Request() req,
    @Param('roomId') roomId: string,
  ): Promise<ChatDocument[]> {
    const ids = roomId.split('-');

    if (ids.includes(req.user._id.toString())) {
      return await this.chatService.findAll(roomId);
    }

    throw new UnauthorizedException(
      "You don't have permission to access this chat",
    );
  }
}
