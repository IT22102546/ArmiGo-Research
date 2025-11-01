import { registerAs } from '@nestjs/config';

export const JwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'CHANGE_ME_SECURE_RANDOM',
  expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'CHANGE_ME_REFRESH_SECRET',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
}));