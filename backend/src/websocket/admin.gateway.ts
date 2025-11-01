import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:19006'],
    credentials: true,
  },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('AdminGateway');
  private connectedClients = new Map<string, AuthenticatedSocket>();

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Admin Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket, ...args: any[]) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} attempted to connect without token`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      client.userId = payload.sub;
      client.userRole = payload.role;

      // Only allow admin and teacher connections to admin namespace
      if (payload.role !== 'ADMIN' && payload.role !== 'TEACHER') {
        this.logger.warn(`Client ${client.id} with role ${payload.role} attempted to connect to admin namespace`);
        client.disconnect();
        return;
      }

      this.connectedClients.set(client.id, client);
      client.join(`user_${payload.sub}`);
      client.join(`role_${payload.role}`);

      this.logger.log(`Client ${client.id} connected (User: ${payload.sub}, Role: ${payload.role})`);
      
      // Send initial connection success
      client.emit('connected', {
        message: 'Connected to admin dashboard',
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error instanceof Error ? error.message : String(error));
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} disconnected`);
  }

  // Real-time notifications for admin dashboard
  notifyUserUpdate(userId: string, userData: any) {
    this.server.to('role_ADMIN').emit('userUpdated', {
      userId,
      data: userData,
      timestamp: new Date().toISOString(),
    });
  }

  notifyClassUpdate(classId: string, classData: any) {
    this.server.to('role_ADMIN').to('role_TEACHER').emit('classUpdated', {
      classId,
      data: classData,
      timestamp: new Date().toISOString(),
    });
  }

  notifyExamUpdate(examId: string, examData: any) {
    this.server.to('role_ADMIN').to('role_TEACHER').emit('examUpdated', {
      examId,
      data: examData,
      timestamp: new Date().toISOString(),
    });
  }

  notifyPaymentUpdate(paymentId: string, paymentData: any) {
    this.server.to('role_ADMIN').emit('paymentUpdated', {
      paymentId,
      data: paymentData,
      timestamp: new Date().toISOString(),
    });
  }

  notifyEnrollment(classId: string, userId: string, enrollmentData: any) {
    this.server.to('role_ADMIN').to('role_TEACHER').emit('newEnrollment', {
      classId,
      userId,
      data: enrollmentData,
      timestamp: new Date().toISOString(),
    });
  }

  // Dashboard stats updates
  broadcastStatsUpdate(stats: any) {
    this.server.to('role_ADMIN').emit('statsUpdated', {
      data: stats,
      timestamp: new Date().toISOString(),
    });
  }

  // System notifications
  broadcastSystemNotification(message: string, type: 'info' | 'warning' | 'error' | 'success') {
    this.server.to('role_ADMIN').emit('systemNotification', {
      message,
      type,
      timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: AuthenticatedSocket, room: string) {
    client.join(room);
    client.emit('joinedRoom', room);
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(client: AuthenticatedSocket, room: string) {
    client.leave(room);
    client.emit('leftRoom', room);
  }

  @SubscribeMessage('ping')
  handlePing(client: AuthenticatedSocket) {
    client.emit('pong', { timestamp: new Date().toISOString() });
  }

  // Get connected clients count
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  // Get connected admins count
  getConnectedAdminsCount(): number {
    return Array.from(this.connectedClients.values())
      .filter(client => client.userRole === 'ADMIN').length;
  }
}