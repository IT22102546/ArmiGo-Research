import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AuthService } from '../auth.service';

@Injectable()
export class TokenCleanupTask {
  private readonly logger = new Logger(TokenCleanupTask.name);

  constructor(private authService: AuthService) {}

  /**
   * Clean up expired refresh tokens every day at 2 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleTokenCleanup() {
    this.logger.log('Starting expired refresh token cleanup...');
    
    try {
      const deletedCount = await this.authService.cleanupExpiredTokens();
      this.logger.log(`Cleaned up ${deletedCount} expired refresh tokens`);
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }
}
