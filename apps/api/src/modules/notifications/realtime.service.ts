import { Injectable, Logger } from '@nestjs/common';
import type { Server, Socket } from 'socket.io';

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private readonly socketsByUser = new Map<string, Set<Socket>>();
  private server: Server | null = null;

  attachServer(server: Server): void {
    this.server = server;
  }

  addClient(userId: string, socket: Socket): void {
    const existing = this.socketsByUser.get(userId) ?? new Set<Socket>();
    existing.add(socket);
    this.socketsByUser.set(userId, existing);
  }

  removeClient(userId: string, socket: Socket): void {
    const existing = this.socketsByUser.get(userId);
    if (!existing) {
      return;
    }
    existing.delete(socket);
    if (existing.size === 0) {
      this.socketsByUser.delete(userId);
    }
  }

  isConnected(userId: string): boolean {
    return (this.socketsByUser.get(userId)?.size ?? 0) > 0;
  }

  emitToUser(userId: string, event: string, payload: unknown): void {
    this.server?.to(`user:${userId}`).emit(event, payload);
    const sockets = this.socketsByUser.get(userId);
    if (!sockets) {
      return;
    }
    for (const socket of sockets) {
      socket.emit(event, payload);
    }
  }

  logConnectedCount(): void {
    this.logger.debug(`Realtime users connected: ${this.socketsByUser.size}`);
  }
}
