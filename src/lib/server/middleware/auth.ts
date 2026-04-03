import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../auth/jwt';

export async function authMiddleware(req: NextRequest): Promise<NextResponse> {
  const token = req.cookies.get('auth-token')?.value 
    || req.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', payload.userId);
  requestHeaders.set('x-user-roles', JSON.stringify(payload.roles));
  requestHeaders.set('x-user-permissions', JSON.stringify(payload.permissions));

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export function requireAuth(req: NextRequest): { userId: string; roles: string[]; permissions: string[] } | null {
  const userId = req.headers.get('x-user-id');
  const rolesHeader = req.headers.get('x-user-roles');
  const permissionsHeader = req.headers.get('x-user-permissions');

  if (!userId) return null;

  return {
    userId,
    roles: rolesHeader ? JSON.parse(rolesHeader) : [],
    permissions: permissionsHeader ? JSON.parse(permissionsHeader) : [],
  };
}