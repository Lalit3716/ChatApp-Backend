import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findOneById(id: string): Promise<User | null> {
    const user = await this.userModel.findById(id);
    if (user) {
      return user;
    } else {
      return null;
    }
  }

  async createUser(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    return await createdUser.save();
  }
}
