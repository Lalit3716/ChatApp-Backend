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

interface MySocket extends Socket {
  userId: string;
}

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

  handleConnection(client: MySocket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: MySocket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const sockets = await this.server.in(client.userId).allSockets();

    if (sockets.size === 0) {
      const user = await this.usersService.changeOnlineStatus(
        client.userId,
        false,
      );
      user.friends.forEach((friendId) => {
        this.server.to(friendId).emit('user-offline', client.userId);
      });
    }
  }

  @SubscribeMessage('initUser')
  async onInitUser(client: MySocket, id: string) {
    client.join(id);
    client.userId = id;
    this.logger.log(`User ID: ${client.userId}`);
    const user = await this.usersService.changeOnlineStatus(id, true);
    user.friends.forEach((friendId) => {
      this.server.to(friendId).emit('user-online', user.id);
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
    this.server.to(request.sender).emit('reject', data);
  }

  @SubscribeMessage('cancelRequest')
  async onCancelRequest(@MessageBody() data: string) {
    this.logger.log(`Cancel request received: ${data}`);
    const request = await this.requestService.reject(data);
    this.server.to(request.receiver).emit('reject', data);
  }

  @SubscribeMessage('removeFriend')
  async onRemoveFriend(@MessageBody() data: any) {
    this.logger.log(`Remove friend received: ${data}`);
    await this.usersService.removeFriend(data.userId, data.friendId);
    this.server.to(data.friendId).emit('removeFriend', data.userId);
  }

  @SubscribeMessage('joinRoom')
  async onJoinRoom(
    @ConnectedSocket() client: MySocket,
    @MessageBody() data: any,
  ) {
    client.join(data);
  }

  @SubscribeMessage('leaveRoom')
  async onLeaveRoom(
    @ConnectedSocket() client: MySocket,
    @MessageBody() data: string,
  ) {
    client.leave(data);
  }

  @SubscribeMessage('message')
  async handleMessage(@MessageBody() data: Chat): Promise<void> {
    await this.chatService.create(data);
    const roomId = [data.sender, data.receiver].sort().join('-');
    this.server.to(roomId).emit('message', data);
  }
}
