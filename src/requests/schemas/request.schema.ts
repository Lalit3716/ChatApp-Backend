import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';

export type RequestDocument = Request & Document;

@Schema({ timestamps: true })
export class Request {
  @Prop({ required: true, ref: 'User' })
  sender: string;

  @Prop({ required: true, ref: 'User' })
  receiver: string;
}

export const RequestSchema = SchemaFactory.createForClass(Request);
