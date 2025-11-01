import { registerAs } from '@nestjs/config';

export const DatabaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USERNAME || 'learnup',
  password: process.env.DB_PASSWORD || 'learnup_password',
  name: process.env.DB_NAME || 'learnup_db',
}));
