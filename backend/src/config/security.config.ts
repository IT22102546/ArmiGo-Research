import { registerAs } from '@nestjs/config';

export const SecurityConfig = registerAs('security', () => ({
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  sessionSecret: process.env.SESSION_SECRET || 'CHANGE_ME_SECURE_SESSION_SECRET',
}));