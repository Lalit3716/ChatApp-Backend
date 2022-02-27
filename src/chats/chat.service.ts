import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ChatDocument, Chat } from './schemas/chat.schema';

@Injectable()
export class ChatService {
  constructor(@InjectModel(Chat.name) private chatModel: Model<ChatDocument>) {}

  async create(chat: Chat) {
    const newChat = new this.chatModel(chat);
    return await newChat.save();
  }

  async findAll(roomId: string): Promise<ChatDocument[]> {
    const [user1, user2] = roomId.split('-');
    return await this.chatModel.find({
      sender: { $in: [user1, user2] },
      receiver: { $in: [user1, user2] },
    });
  }
}
