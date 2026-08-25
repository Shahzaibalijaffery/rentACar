import {
  Injectable,
  Logger,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { AppConfig } from '../../config/env.config';
import { RealtimeService } from './realtime.service';

type JwtPayload = {
  sub: string;
  email: string;
  emailVerified: boolean;
};

@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: '*' },
  transports: ['websocket'],
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly realtimeService: RealtimeService,
  ) {}

  onModuleInit(): void {
    this.logger.log('Realtime gateway ready on /realtime');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token = this.readToken(client);
      if (!token) {
        throw new UnauthorizedException('Authentication required');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.get('jwtAccessSecret', { infer: true }),
      });

      const userId = payload.sub;
      client.data.userId = userId;
      void client.join(`user:${userId}`);
      this.realtimeService.addClient(userId, client);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data.userId as string | undefined;
    if (userId) {
      this.realtimeService.removeClient(userId, client);
    }
  }

  private readToken(client: Socket): string | undefined {
    const auth = client.handshake.auth as { token?: unknown };
    if (typeof auth.token === 'string' && auth.token.length > 0) {
      return auth.token;
    }

    const header = client.handshake.headers.authorization;
    if (typeof header === 'string' && header.startsWith('Bearer ')) {
      return header.slice('Bearer '.length).trim();
    }

    const queryToken = client.handshake.query['token'];
    return typeof queryToken === 'string' ? queryToken : undefined;
  }
}
