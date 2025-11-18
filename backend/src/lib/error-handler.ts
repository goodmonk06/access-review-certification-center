import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from './errors';

export interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export function errorHandler(
  error: Error | FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  // Log error
  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
  });

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: error.errors,
      },
    };
    return reply.status(400).send(response);
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: error.message,
        code: error.constructor.name.replace('Error', '').toUpperCase(),
      },
    };
    return reply.status(error.statusCode).send(response);
  }

  // Handle Fastify validation errors
  if ('validation' in error) {
    const response: ErrorResponse = {
      success: false,
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        details: (error as FastifyError).validation,
      },
    };
    return reply.status(400).send(response);
  }

  // Default internal server error
  const response: ErrorResponse = {
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : error.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  };

  return reply.status(500).send(response);
}
