// modules/users/payment-cron.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { UserManagementService } from "./user-management.service";

@Injectable()
export class PaymentCronService {
  private readonly logger = new Logger(PaymentCronService.name);

  constructor(private userManagementService: UserManagementService) {}

  // Run at midnight on the 1st day of every month
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async autoCalculateMonthlyPayments() {
    this.logger.log("Starting automatic monthly payment calculation...");

    try {
      // Calculate for previous month
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const month = lastMonth.toISOString().slice(0, 7); // "YYYY-MM"

      this.logger.log(`Calculating payments for month: ${month}`);

      const result =
        await this.userManagementService.calculateAllMonthlyPayments(month);

      this.logger.log(
        `Monthly payment calculation completed: ${result.success} successful, ${result.failed} failed`
      );

      if (result.errors.length > 0) {
        this.logger.warn(
          `Errors encountered: ${JSON.stringify(result.errors)}`
        );
      }
    } catch (error: any) {
      // Add type annotation here
      this.logger.error(
        `Failed to calculate monthly payments: ${error?.message}`,
        error?.stack
      );
    }
  }
}
