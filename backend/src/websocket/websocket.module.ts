import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGateway } from './admin.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  providers: [AdminGateway],
  exports: [AdminGateway],
})
export class WebSocketModule {}