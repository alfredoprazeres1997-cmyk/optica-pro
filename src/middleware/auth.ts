import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { eq } from 'drizzle-orm';
import { adminAuth } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';

export interface AuthContextUser {
  id: number;
  uid: string;
  tenantId: number;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
}

export interface AuthRequest extends Request {
  firebaseUser?: DecodedIdToken;
  appUser?: AuthContextUser;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Não autorizado: token em falta.' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    req.firebaseUser = decoded;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Não autorizado: sessão inválida ou expirada.' });
  }
};

export const attachTenantUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.firebaseUser) {
    return res.status(401).json({ error: 'Sessão não autenticada.' });
  }

  try {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.uid, req.firebaseUser.uid));

    const found = rows[0];
    if (!found || !found.tenantId) {
      return res.status(403).json({
        error: 'Conta de óptica não inicializada. Execute /api/bootstrap primeiro.',
      });
    }

    if (!found.active) {
      return res.status(403).json({ error: 'Utilizador desactivado pelo administrador.' });
    }

    req.appUser = {
      id: found.id,
      uid: found.uid,
      tenantId: found.tenantId,
      name: found.name,
      email: found.email,
      role: found.role,
      avatarUrl: found.avatarUrl,
    };
    next();
  } catch (error) {
    console.error('Error loading tenant user:', error);
    return res.status(500).json({ error: 'Erro ao validar permissões da óptica.' });
  }
};

export const requireRoles = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.appUser) {
      return res.status(401).json({ error: 'Utilizador não autenticado.' });
    }
    if (!allowedRoles.includes(req.appUser.role)) {
      return res.status(403).json({
        error: 'Sem permissão para aceder a este recurso.',
      });
    }
    next();
  };
};
