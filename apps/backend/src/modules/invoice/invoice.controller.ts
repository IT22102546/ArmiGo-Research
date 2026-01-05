import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from "@nestjs/common";
import { InvoiceService } from "./invoice.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole, InvoiceType, InvoiceStatus } from "@prisma/client";

@Controller("invoices")
@UseGuards(JwtAuthGuard, RolesGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post("generate/monthly")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateMonthlyInvoice(@Body() body: any, @Req() req: any) {
    return this.invoiceService.generateMonthlyInvoice(body, req.user.userId);
  }

  @Post("generate/enrollment")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async generateEnrollmentInvoice(@Body() body: any, @Req() req: any) {
    return this.invoiceService.generateEnrollmentInvoice(body, req.user.userId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createInvoice(@Body() body: any, @Req() req: any) {
    return this.invoiceService.createInvoice(body, req.user.userId);
  }

  @Get()
  async getInvoices(@Query() query: any, @Req() req: any) {
    // Students can only see their own invoices
    if (
      req.user.role === UserRole.INTERNAL_STUDENT ||
      req.user.role === UserRole.EXTERNAL_STUDENT
    ) {
      query.studentId = req.user.userId;
    }

    const filters = {
      ...query,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      minAmount: query.minAmount ? parseFloat(query.minAmount) : undefined,
      maxAmount: query.maxAmount ? parseFloat(query.maxAmount) : undefined,
    };

    return this.invoiceService.getInvoiceList(filters);
  }

  @Get("statistics")
  async getStatistics(@Query() query: any, @Req() req: any) {
    const filters: any = {};

    // Students can only see their own statistics
    if (
      req.user.role === UserRole.INTERNAL_STUDENT ||
      req.user.role === UserRole.EXTERNAL_STUDENT
    ) {
      filters.studentId = req.user.userId;
    } else if (query.studentId) {
      filters.studentId = query.studentId;
    }

    if (query.startDate) {
      filters.startDate = new Date(query.startDate);
    }
    if (query.endDate) {
      filters.endDate = new Date(query.endDate);
    }

    return this.invoiceService.getStatistics(filters);
  }

  @Get(":id")
  async getInvoiceById(@Param("id") id: string, @Req() req: any) {
    const invoice = await this.invoiceService.getInvoiceById(id);

    // Students can only view their own invoices
    if (
      (req.user.role === UserRole.INTERNAL_STUDENT ||
        req.user.role === UserRole.EXTERNAL_STUDENT) &&
      invoice.studentId !== req.user.userId
    ) {
      throw new Error("Unauthorized");
    }

    return invoice;
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateInvoice(@Param("id") id: string, @Body() body: any) {
    return this.invoiceService.updateInvoice(id, body);
  }

  @Patch(":id/mark-paid")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async markAsPaid(
    @Param("id") id: string,
    @Body() body: { paymentId?: string }
  ) {
    return this.invoiceService.markAsPaid(id, body.paymentId);
  }

  @Patch(":id/cancel")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelInvoice(
    @Param("id") id: string,
    @Body() body: { reason?: string }
  ) {
    return this.invoiceService.cancelInvoice(id, body.reason);
  }

  @Post(":id/send")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async sendInvoice(@Param("id") id: string) {
    return this.invoiceService.sendInvoice(id);
  }

  @Delete(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async deleteInvoice(@Param("id") id: string) {
    return this.invoiceService.deleteInvoice(id);
  }
}
