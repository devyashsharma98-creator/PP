import { NextRequest, NextResponse } from 'next/server';
import { AppError } from '../errors/app-errors';

export interface ExtendedNextRequest extends NextRequest {
  user?: {
    userId: string;
    roles: string[];
    permissions: string[];
  };
}

export async function errorHandler(
  error: Error,
  _req: ExtendedNextRequest,
  res: NextResponse
): Promise<NextResponse> {
  console.error('Error handler caught:', error);

  if (error instanceof AppError) {
    return NextResponse.json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    }, { status: error.statusCode });
  }

  // Unknown error
  console.error('Unexpected error:', error);
  return NextResponse.json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  }, { status: 500 });
}