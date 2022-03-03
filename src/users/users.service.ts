import { genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { ChatService } from 'src/chats/chat.service';
import { CreateUserDto } from './schemas/user.dto';

export interface FriendDocument {
  _id: string;
  username: string;
  email: string;
  lastMessage?: string;
  lastMessageCreatedAt?: Date;
  online: boolean;
  unseen: number;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private chatService: ChatService,
  ) {}

  async createUser(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    createdUser.salt = await genSalt();
    createdUser.password = await hash(createdUser.password, createdUser.salt);
    try {
      return await createdUser.save();
    } catch (e) {
      throw new HttpException(
        'User with this email or username already exists',
        400,
      );
    }
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email });
  }

  async getUser(userId: string): Promise<UserDocument> {
    return await this.userModel.findById(userId);
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ username });
  }

  async addFriend(userId: string, friendId: string) {
    const user = await this.userModel.findById(userId);
    user.friends.push(friendId);
    await user.save();
  }

  async removeFriend(userId: string, friendId: string) {
    const user = await this.userModel.findById(userId);
    user.friends = user.friends.filter((id) => id !== friendId);

    await this.chatService.removeChats(userId, friendId);

    await user.save();
  }

  async getFriends(user: UserDocument): Promise<FriendDocument[]> {
    const friends = await this.userModel.find({ _id: { $in: user.friends } });
    const hydratedFriends = await this.chatService.updateWithLastMessages(
      user._id,
      friends,
    );
    return hydratedFriends;
  }

  async changeOnlineStatus(userId: string, status: boolean) {
    const user = await this.userModel.findById(userId);
    user.online = status;
    return await user.save();
  }
}
