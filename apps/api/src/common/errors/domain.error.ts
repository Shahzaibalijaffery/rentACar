export class DomainError extends Error {
  constructor(
    message: string,
    readonly errorCode: string,
    readonly statusCode = 400,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}
