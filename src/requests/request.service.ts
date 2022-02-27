import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Injectable } from '@nestjs/common';
import { Request, RequestDocument } from './schemas/request.schema';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class RequestService {
  constructor(
    @InjectModel(Request.name)
    private readonly requestModel: Model<RequestDocument>,
    private readonly usersService: UsersService,
  ) {}

  async findAll(userId: string): Promise<RequestDocument[]> {
    return await this.requestModel
      .find({ receiver: userId })
      .populate('sender');
  }

  async create(sender: string, receiver: string): Promise<RequestDocument> {
    const request = new this.requestModel({
      sender,
      receiver,
    });
    await request.save();
    return request.populate([
      { path: 'sender', select: ['id', 'username', 'email'] },
      { path: 'receiver', select: ['id', 'username', 'email'] },
    ]);
  }

  async accept(id: string): Promise<RequestDocument> {
    const request = await this.requestModel.findById(id);

    await this.usersService.addFriend(request.sender, request.receiver);

    await this.usersService.addFriend(request.receiver, request.sender);

    return await request.remove();
  }

  async reject(id: string): Promise<RequestDocument> {
    const request = await this.requestModel.findById(id);
    const removedRequest = await request.remove();
    return removedRequest;
  }
}
