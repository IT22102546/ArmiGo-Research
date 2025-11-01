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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentDto,
  ProcessPaymentDto,
  RefundPaymentDto,
  PaymentResponseDto,
  PaymentIntentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment intent',
    description: 'Creates a payment intent for processing payment',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Payment intent created successfully',
    type: PaymentIntentDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or class not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User already enrolled in class',
  })
  async createPaymentIntent(
    @Body() createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentIntentDto> {
    return this.paymentsService.createPaymentIntent(createPaymentDto);
  }

  @Post(':id/process')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Process payment',
    description: 'Processes a payment using payment gateway',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 'payment_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment processed successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Payment processing failed',
  })
  async processPayment(
    @Param('id') id: string,
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.processPayment(id, processPaymentDto);
  }

  @Post(':id/refund')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refund payment',
    description: 'Processes a refund for a completed payment',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 'payment_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Refund processing failed',
  })
  async refundPayment(
    @Param('id') id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.refundPayment(id, refundPaymentDto);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get user payments',
    description: 'Retrieves all payments for a specific user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: 'user_123',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User payments retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PaymentResponseDto' },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            total: { type: 'number' },
            pages: { type: 'number' },
          },
        },
      },
    },
  })
  async getUserPayments(
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findUserPayments(userId, page, limit);
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user payments',
    description: 'Retrieves all payments for the currently authenticated user',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    example: 10,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user payments retrieved successfully',
  })
  async getMyPayments(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.findUserPayments(req.user.id, page, limit);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment statistics',
    description: 'Retrieves payment statistics (admin only)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalRevenue: { type: 'number' },
        totalPayments: { type: 'number' },
        completedPayments: { type: 'number' },
        refundedPayments: { type: 'number' },
        pendingPayments: { type: 'number' },
      },
    },
  })
  async getPaymentStats() {
    return this.paymentsService.getPaymentStats();
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user payment statistics',
    description: 'Retrieves payment statistics for the currently authenticated user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User payment statistics retrieved successfully',
  })
  async getMyPaymentStats(@Request() req) {
    return this.paymentsService.getPaymentStats(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get payment by ID',
    description: 'Retrieves a specific payment by its ID',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: 'payment_123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment retrieved successfully',
    type: PaymentResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  async getPayment(@Param('id') id: string): Promise<PaymentResponseDto> {
    return this.paymentsService.findPaymentById(id);
  }
}