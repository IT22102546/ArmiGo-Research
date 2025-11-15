import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  Res,
  HttpException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards";
import { UserManagementService } from "./user-management.service";
import {
  UpdateTeacherPaymentDto,
  MonthlyPaymentDto,
  TeacherPaymentSummaryDto,
} from "./dto/user-management.dto";
import { Response } from "express";

@ApiTags("Teacher Payments")
@Controller("teacher-payments")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TeacherPaymentController {
  constructor(private readonly userManagementService: UserManagementService) {}

  @Put(":teacherProfileId")
  @ApiOperation({ summary: "Update teacher payment settings" })
  @ApiParam({ name: "teacherProfileId", description: "Teacher profile ID" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment settings updated",
  })
  async updatePaymentSettings(
    @Param("teacherProfileId") teacherProfileId: string,
    @Body() data: UpdateTeacherPaymentDto
  ) {
    return this.userManagementService.updateTeacherPayment(
      teacherProfileId,
      data
    );
  }

  @Post("calculate/:teacherProfileId")
  @ApiOperation({ summary: "Calculate monthly payment for teacher" })
  @ApiParam({ name: "teacherProfileId", description: "Teacher profile ID" })
  @ApiQuery({
    name: "month",
    description: "Month in YYYY-MM format",
    example: "2024-01",
  })
  async calculateMonthlyPayment(
    @Param("teacherProfileId") teacherProfileId: string,
    @Query("month") month: string
  ) {
    return this.userManagementService.calculateMonthlyPayment(
      teacherProfileId,
      month
    );
  }

  @Post("calculate-all")
  @ApiOperation({ summary: "Calculate monthly payments for all teachers" })
  @ApiQuery({
    name: "month",
    description: "Month in YYYY-MM format",
    example: "2024-01",
    required: true,
  })
  async calculateAllPayments(@Query("month") month: string) {
    try {
      const result =
        await this.userManagementService.calculateAllMonthlyPayments(month);

      // Use the correct property names from the result
      return {
        success: result.success, // Use result.success instead of result.successCount
        failed: result.failed, // Use result.failed instead of result.failedCount
        message: "Payments calculated successfully",
        results: result.results,
        errors: result.errors,
      };
    } catch (error) {
      // Proper error handling for unknown type
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      throw new HttpException(
        `Failed to calculate payments: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(":paymentId/mark-paid")
  @ApiOperation({ summary: "Mark payment as completed" })
  @ApiParam({ name: "paymentId", description: "Payment record ID" })
  @ApiQuery({ name: "paidBy", description: "Admin user ID who marked as paid" })
  async markPaymentAsPaid(
    @Param("paymentId") paymentId: string,
    @Query("paidBy") paidBy: string,
    @Body() body: { notes?: string }
  ) {
    return this.userManagementService.markPaymentAsPaid(
      paymentId,
      paidBy,
      body.notes
    );
  }

  @Get("teacher/:teacherProfileId")
  @ApiOperation({ summary: "Get teacher payment summary" })
  @ApiParam({ name: "teacherProfileId", description: "Teacher profile ID" })
  @ApiQuery({
    name: "months",
    required: false,
    description: "Number of months to include",
    example: 6,
  })
  async getTeacherPaymentSummary(
    @Param("teacherProfileId") teacherProfileId: string,
    @Query("months") months: number = 6
  ) {
    return this.userManagementService.getTeacherPaymentSummary(
      teacherProfileId,
      months
    );
  }

  @Get("export")
  @ApiOperation({ summary: "Export payments to CSV" })
  @ApiQuery({ name: "month", required: false, description: "Filter by month" })
  async exportPayments(
    @Query("month") month?: string,
    @Res() res?: Response
  ): Promise<void> {
    const csv = await this.userManagementService.exportPayments(month);
    const filename = `teacher-payments${month ? `-${month}` : ""}_${new Date().toISOString().split("T")[0]}.csv`;

    // Check if res is defined before using it
    if (!res) {
      throw new HttpException(
        "Response object not available",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  @Get("pending")
  @ApiOperation({ summary: "Get all pending payments" })
  @ApiQuery({ name: "month", required: false, description: "Filter by month" })
  async getPendingPayments(@Query("month") month?: string) {
    return this.userManagementService.getAllPendingPayments(month);
  }

  // Optional: Add a proper monthly summary endpoint
  // @Get("summary/:month")
  // @ApiOperation({ summary: "Get payment summary for a specific month" })
  // @ApiParam({ name: "month", description: "Month in YYYY-MM format" })
  // async getMonthlySummary(@Param("month") month: string) {
  //   return this.userManagementService.getMonthlyPaymentSummary(month);
  // }
}
