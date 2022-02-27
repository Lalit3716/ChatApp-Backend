import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { RequestService } from 'src/requests/request.service';
import { ChatService } from './chat.service';
import { Chat } from './schemas/chat.schema';
import { UsersService } from 'src/users/users.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly requestService: RequestService,
    private readonly chatService: ChatService,
    private readonly usersService: UsersService,
  ) {}

  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    client.rooms.forEach(async (room) => {
      client.leave(room);
      if (!room.includes('-')) {
        const user = await this.usersService.changeOnlineStatus(room, false);
        user.friends.forEach((friend) => {
          this.server.to(friend).emit('offline', user.id);
        });
      }
    });
  }

  @SubscribeMessage('initUser')
  async onInitUser(client: Socket, id: string) {
    this.logger.log(`User ID: ${id}`);
    client.join(id);
    const user = await this.usersService.changeOnlineStatus(id, true);
    user.friends.forEach((friendId) => {
      this.server.to(friendId).emit('online', user.id);
    });
  }

  @SubscribeMessage('request')
  async onRequest(@MessageBody() data: any) {
    const request = await this.requestService.create(
      data.sender,
      data.receiver,
    );
    this.server.to(data.receiver).emit('request', request);
    return request;
  }

  @SubscribeMessage('accept')
  async onAccept(@MessageBody() data: string) {
    this.logger.log(`Accept received: ${data}`);
    const request = await this.requestService.accept(data);
    this.server.to(request.sender).emit('accept', data);
  }

  @SubscribeMessage('reject')
  async onReject(@MessageBody() data: string) {
    this.logger.log(`Reject received: ${data}`);
    const request = await this.requestService.reject(data);
    this.server.to(request.sender).emit('reject', request);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ) {
    this.logger.log(`Join Room ID: ${data}`);
    client.join(data);
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: string,
  ) {
    this.logger.log(`Leave Room ID: ${data}`);
    client.leave(data);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: Chat): Promise<void> {
    this.logger.log(`Message received: ${data}`);
    await this.chatService.create(data);
    const roomId = [data.sender, data.receiver].sort().join('-');
    this.server.to(roomId).emit('message', data);
  }
}
