import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import type { ApiErrorBody } from '@rentacar/shared';
import { DomainError } from '../errors/domain.error';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      this.logger.error(
        'Unhandled non-HTTP error',
        exception instanceof Error ? exception.stack : undefined,
      );
      return;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    const body = this.toErrorBody(exception);

    if (body.statusCode >= 500) {
      const location = `${request.method ?? '?'} ${request.url ?? '?'}`;
      this.logger.error(
        `${location} Unhandled server error: ${exception instanceof Error ? exception.message : 'unknown'}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(body.statusCode).json(body);
  }

  private toErrorBody(exception: unknown): ApiErrorBody {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        message: exception.message,
        errorCode: exception.errorCode,
        details: exception.details,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        return { statusCode, message: exceptionResponse };
      }

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const payload = exceptionResponse as Record<string, unknown>;
        const rawMessage = payload['message'];
        const message = Array.isArray(rawMessage)
          ? rawMessage.map(String).join(', ')
          : typeof rawMessage === 'string'
            ? rawMessage
            : exception.message;

        return {
          statusCode,
          message,
          details: payload,
        };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      errorCode: 'INTERNAL_ERROR',
    };
  }
}
