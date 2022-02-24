import { genSalt, hash } from 'bcryptjs';
import { Model } from 'mongoose';
import { HttpException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './schemas/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
}
