import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    
    // Check if user exists in the DB to sync it
    const existingUsers = await db.select().from(users).where(eq(users.uid, decodedToken.uid));
    if (existingUsers.length === 0) {
      // Sync basic profile from Firebase Auth token
      await db.insert(users).values({
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        fullName: decodedToken.name || decodedToken.email?.split('@')[0] || 'Unknown User',
        role: 'STUDENT',
        status: 'ACTIVE'
      });
    }
    
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }
};
