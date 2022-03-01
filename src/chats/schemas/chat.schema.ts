import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ChatDocument = Chat & Document;

@Schema()
export class Chat {
  @Prop({ required: true })
  message: string;

  @Prop({ required: true, ref: 'User' })
  sender: string;

  @Prop({ required: true, ref: 'User' })
  receiver: string;

  @Prop({ required: true, default: Date.now })
  createdAt: Date;
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
