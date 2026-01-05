import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  PaymentResponseDto,
  PaymentIntentDto,
} from "./dto";
import { JwtAuthGuard } from "@common/guards";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post("intent")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create payment intent",
    description: "Creates a payment intent for processing payment",
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Payment intent created successfully",
    type: PaymentIntentDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "User or class not found",
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "User already enrolled in class",
  })
  async createPaymentIntent(
    @Body() createPaymentDto: CreatePaymentDto
  ): Promise<PaymentIntentDto> {
    return this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  @Post(":id/process")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Process payment",
    description: "Processes a payment using payment gateway",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
    example: "payment_123",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment processed successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Payment not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Payment processing failed",
  })
  async processPayment(
    @Param("id") id: string,
    @Body() processPaymentDto: ProcessPaymentDto
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.processPayment(id, processPaymentDto);
  }

  @Post(":id/refund")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Refund payment",
    description: "Processes a refund for a completed payment",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
    example: "payment_123",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment refunded successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Payment not found",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Refund processing failed",
  })
  async refundPayment(
    @Param("id") id: string,
    @Body() refundPaymentDto: RefundPaymentDto
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.refundPayment(id, refundPaymentDto);
  }

  @Get("user/:userId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user payments",
    description: "Retrieves all payments for a specific user",
  })
  @ApiParam({
    name: "userId",
    description: "User ID",
    example: "user_123",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User payments retrieved successfully",
    schema: {
      type: "object",
      properties: {
        data: {
          type: "array",
          items: { $ref: "#/components/schemas/PaymentResponseDto" },
        },
        pagination: {
          type: "object",
          properties: {
            page: { type: "number" },
            limit: { type: "number" },
            total: { type: "number" },
            pages: { type: "number" },
          },
        },
      },
    },
  })
  async getUserPayments(
    @Param("userId") userId: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.paymentsService.findUserPayments(userId, page, limit);
  }

  @Get("my-payments")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user payments",
    description: "Retrieves all payments for the currently authenticated user",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Current user payments retrieved successfully",
  })
  async getMyPayments(
    @Request() req: any,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    return this.paymentsService.findUserPayments(req.user.id, page, limit);
  }

  @Get("stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get payment statistics",
    description: "Retrieves payment statistics (admin only)",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment statistics retrieved successfully",
    schema: {
      type: "object",
      properties: {
        totalRevenue: { type: "number" },
        totalPayments: { type: "number" },
        completedPayments: { type: "number" },
        refundedPayments: { type: "number" },
        pendingPayments: { type: "number" },
      },
    },
  })
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get("my-stats")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get current user payment statistics",
    description:
      "Retrieves payment statistics for the currently authenticated user",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "User payment statistics retrieved successfully",
  })
  async getMyPaymentStats(@Request() req: any) {
    return this.paymentsService.getPaymentStats(req.user.id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get payment by ID",
    description: "Retrieves a specific payment by its ID",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
    example: "payment_123",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment retrieved successfully",
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Payment not found",
  })
  async getPayment(@Param("id") id: string): Promise<PaymentResponseDto> {
    return this.paymentsService.findPaymentById(id);
  }

  // Admin Management Endpoints
  @Get("admin/all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get all payments (Admin)",
    description: "Admin endpoint to retrieve all payments with filters",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Filter by payment status",
    example: "PENDING",
  })
  @ApiQuery({
    name: "method",
    required: false,
    description: "Filter by payment method",
    example: "BANK_SLIP",
  })
  @ApiQuery({
    name: "dateFrom",
    required: false,
    description: "Filter by start date",
  })
  @ApiQuery({
    name: "dateTo",
    required: false,
    description: "Filter by end date",
  })
  @ApiQuery({
    name: "userType",
    required: false,
    description: "Filter by user type",
  })
  @ApiQuery({
    name: "referenceType",
    required: false,
    description: "Filter by reference type",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page",
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payments retrieved successfully",
  })
  async getAllPaymentsAdmin(
    @Query("status") status?: string,
    @Query("method") method?: string,
    @Query("dateFrom") dateFrom?: string,
    @Query("dateTo") dateTo?: string,
    @Query("userType") userType?: string,
    @Query("referenceType") referenceType?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.paymentsService.getAllPaymentsAdmin({
      status,
      method,
      dateFrom,
      dateTo,
      userType,
      referenceType,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Patch("admin/:id/approve-bank-slip")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Approve bank slip (Admin)",
    description: "Admin endpoint to approve a bank slip payment",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bank slip approved successfully",
  })
  async approveBankSlip(
    @Param("id") id: string,
    @Body() body: { note?: string },
    @Request() req: any
  ) {
    return this.paymentsService.approveBankSlip(id, req.user.id, body.note);
  }

  @Patch("admin/:id/reject-bank-slip")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Reject bank slip (Admin)",
    description: "Admin endpoint to reject a bank slip payment",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bank slip rejected successfully",
  })
  async rejectBankSlip(
    @Param("id") id: string,
    @Body() body: { reason: string },
    @Request() req: any
  ) {
    return this.paymentsService.rejectBankSlip(id, req.user.id, body.reason);
  }

  @Post("admin/bulk-approve")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Bulk approve bank slips (Admin)",
    description:
      "Admin endpoint to approve multiple bank slip payments at once",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bank slips approved successfully",
  })
  async bulkApproveBankSlips(
    @Body() body: { paymentIds: string[] },
    @Request() req: any
  ) {
    return this.paymentsService.bulkApproveBankSlips(
      body.paymentIds,
      req.user.id
    );
  }

  @Patch("admin/:id/mark-suspicious")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Mark payment as suspicious (Admin)",
    description: "Admin endpoint to flag a payment for investigation",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment marked as suspicious successfully",
  })
  async markPaymentSuspicious(
    @Param("id") id: string,
    @Body() body: { reason: string },
    @Request() req: any
  ) {
    return this.paymentsService.markPaymentSuspicious(
      id,
      req.user.id,
      body.reason
    );
  }

  @Post("admin/:id/sync-tracker-plus")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Sync Tracker Plus payment (Admin)",
    description:
      "Admin endpoint to manually sync payment status with Tracker Plus",
  })
  @ApiParam({
    name: "id",
    description: "Payment ID",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Payment synced successfully",
  })
  async syncTrackerPlus(@Param("id") id: string) {
    return this.paymentsService.syncTrackerPlus(id);
  }
}
