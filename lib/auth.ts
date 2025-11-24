import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@/types/user';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_here';

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  // Validate inputs
  if (!password || !hashedPassword) {
    console.error('verifyPassword: Invalid arguments - password or hashedPassword is undefined/null');
    return false;
  }
  
  if (typeof password !== 'string' || typeof hashedPassword !== 'string') {
    console.error('verifyPassword: Invalid argument types - both must be strings');
    return false;
  }
  
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: User): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      user_type: user.user_type
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}
