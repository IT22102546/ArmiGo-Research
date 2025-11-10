import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { InvoiceStatus, InvoiceType, Prisma } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

// DTOs
export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface CreateInvoiceDto {
  studentId: string;
  type: InvoiceType;
  items: InvoiceItem[];
  tax?: number;
  discount?: number;
  dueDate: Date;
  notes?: string;
  metadata?: any;
}

export interface UpdateInvoiceDto {
  status?: InvoiceStatus;
  items?: InvoiceItem[];
  tax?: number;
  discount?: number;
  dueDate?: Date;
  notes?: string;
}

export interface InvoiceFilterDto {
  studentId?: string;
  type?: InvoiceType;
  status?: InvoiceStatus;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export interface InvoiceListResponse {
  data: any[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  statusBreakdown: {
    [key: string]: number;
  };
  typeBreakdown: {
    [key: string]: number;
  };
}

export interface MonthlyInvoiceDto {
  studentId: string;
  month: number;
  year: number;
  classIds?: string[];
}

export interface EnrollmentInvoiceDto {
  enrollmentId: string;
}

@Injectable()
export class InvoiceService {
  constructor(private prisma: PrismaService) {}

  private generateInvoiceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  private calculateTotals(
    items: InvoiceItem[],
    tax: number = 0,
    discount: number = 0
  ) {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * tax) / 100;
    const discountAmount = (subtotal * discount) / 100;
    const total = subtotal + taxAmount - discountAmount;

    return {
      subtotal,
      tax: taxAmount,
      discount: discountAmount,
      total,
    };
  }

  async generateMonthlyInvoice(data: MonthlyInvoiceDto, createdById: string) {
    // Get student info
    const student = await this.prisma.user.findUnique({
      where: { id: data.studentId },
      include: {
        studentProfile: true,
      },
    });

    if (!student) {
      throw AppException.notFound(
        ErrorCode.STUDENT_NOT_FOUND,
        "Student not found"
      );
    }

    // Get student's enrollments
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        studentId: data.studentId,
        status: "ACTIVE",
        deletedAt: null,
        ...(data.classIds && data.classIds.length > 0
          ? { classId: { in: data.classIds } }
          : {}),
      },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (enrollments.length === 0) {
      throw AppException.badRequest(
        ErrorCode.NO_ACTIVE_ENROLLMENTS,
        "No active enrollments found for this student"
      );
    }

    // Create invoice items from enrollments
    const items: InvoiceItem[] = enrollments.map((enrollment) => ({
      description: `Monthly fee - ${enrollment.class.subject?.name || "Subject"}`,
      quantity: 1,
      unitPrice: 1000, // Default monthly fee - should be configured
      amount: 1000,
    }));

    const dueDate = new Date(data.year, data.month, 10); // Due on 10th of the month

    return this.createInvoice(
      {
        studentId: data.studentId,
        type: InvoiceType.MONTHLY_FEE,
        items,
        dueDate,
        notes: `Monthly invoice for ${new Date(data.year, data.month - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
        metadata: {
          month: data.month,
          year: data.year,
          enrollmentIds: enrollments.map((e) => e.id),
        },
      },
      createdById
    );
  }

  async generateEnrollmentInvoice(
    data: EnrollmentInvoiceDto,
    createdById: string
  ) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        class: {
          include: {
            subject: true,
          },
        },
        student: true,
      },
    });

    if (!enrollment) {
      throw AppException.notFound(
        ErrorCode.ENROLLMENT_NOT_FOUND,
        "Enrollment not found"
      );
    }

    // Check if invoice already exists for this enrollment
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        studentId: enrollment.studentId,
        type: InvoiceType.ENROLLMENT_FEE,
        metadata: {
          path: ["enrollmentId"],
          equals: enrollment.id,
        },
        deletedAt: null,
      },
    });

    if (existingInvoice) {
      throw AppException.badRequest(
        ErrorCode.INVOICE_ALREADY_EXISTS,
        "Invoice already exists for this enrollment"
      );
    }

    const items: InvoiceItem[] = [
      {
        description: `Enrollment fee - ${enrollment.class.subject?.name || "Subject"}`,
        quantity: 1,
        unitPrice: 2000, // Default enrollment fee - should be configured
        amount: 2000,
      },
    ];

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

    return this.createInvoice(
      {
        studentId: enrollment.studentId,
        type: InvoiceType.ENROLLMENT_FEE,
        items,
        dueDate,
        notes: `Enrollment fee for ${enrollment.class.subject?.name || "Subject"}`,
        metadata: {
          enrollmentId: enrollment.id,
          classId: enrollment.classId,
        },
      },
      createdById
    );
  }

  async createInvoice(data: CreateInvoiceDto, createdById: string) {
    const totals = this.calculateTotals(data.items, data.tax, data.discount);
    const invoiceNumber = this.generateInvoiceNumber();

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        studentId: data.studentId,
        type: data.type,
        items: data.items as any,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        dueDate: data.dueDate,
        notes: data.notes,
        metadata: data.metadata,
        createdById,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getInvoiceList(
    filters: InvoiceFilterDto
  ): Promise<InvoiceListResponse> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.issuedDate = {};
      if (filters.startDate) {
        where.issuedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.issuedDate.lte = filters.endDate;
      }
    }

    if (filters.minAmount !== undefined || filters.maxAmount !== undefined) {
      where.total = {};
      if (filters.minAmount !== undefined) {
        where.total.gte = filters.minAmount;
      }
      if (filters.maxAmount !== undefined) {
        where.total.lte = filters.maxAmount;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedDate: "desc" },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Update overdue invoices
    const now = new Date();
    const overdueInvoices = data.filter(
      (invoice) =>
        invoice.status !== InvoiceStatus.PAID &&
        invoice.status !== InvoiceStatus.CANCELLED &&
        invoice.dueDate < now
    );

    if (overdueInvoices.length > 0) {
      await this.prisma.invoice.updateMany({
        where: {
          id: { in: overdueInvoices.map((inv) => inv.id) },
          status: { notIn: [InvoiceStatus.PAID, InvoiceStatus.CANCELLED] },
        },
        data: { status: InvoiceStatus.OVERDUE },
      });

      // Refetch updated data
      const updatedData = await this.prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { issuedDate: "desc" },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return {
        data: updatedData,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getInvoiceById(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    // Update status if overdue
    if (
      invoice.status !== InvoiceStatus.PAID &&
      invoice.status !== InvoiceStatus.CANCELLED &&
      invoice.dueDate < new Date()
    ) {
      await this.prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.OVERDUE },
      });
      invoice.status = InvoiceStatus.OVERDUE;
    }

    return invoice;
  }

  async updateInvoice(id: string, data: UpdateInvoiceDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw AppException.badRequest(
        ErrorCode.CANNOT_UPDATE_PAID_INVOICE,
        "Cannot update a paid invoice"
      );
    }

    const updateData: any = {};

    if (data.status) {
      updateData.status = data.status;
    }

    if (data.items) {
      const totals = this.calculateTotals(
        data.items,
        data.tax !== undefined ? data.tax : invoice.tax,
        data.discount !== undefined ? data.discount : invoice.discount
      );
      updateData.items = data.items as any;
      updateData.subtotal = totals.subtotal;
      updateData.tax = totals.tax;
      updateData.discount = totals.discount;
      updateData.total = totals.total;
    }

    if (data.dueDate) {
      updateData.dueDate = data.dueDate;
    }

    if (data.notes !== undefined) {
      updateData.notes = data.notes;
    }

    return this.prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async markAsPaid(id: string, paymentId?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw AppException.badRequest(
        ErrorCode.INVOICE_ALREADY_PAID,
        "Invoice is already paid"
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentId,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async cancelInvoice(id: string, reason?: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw AppException.badRequest(
        ErrorCode.CANNOT_CANCEL_PAID_INVOICE,
        "Cannot cancel a paid invoice"
      );
    }

    if (invoice.status === InvoiceStatus.CANCELLED) {
      throw AppException.badRequest(
        ErrorCode.INVOICE_ALREADY_CANCELLED,
        "Invoice is already cancelled"
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.CANCELLED,
        notes: reason
          ? `${invoice.notes || ""}\n\nCancellation reason: ${reason}`
          : invoice.notes,
      },
    });
  }

  async sendInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        student: true,
      },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    // Update status and sentAt
    await this.prisma.invoice.update({
      where: { id },
      data: {
        status:
          invoice.status === InvoiceStatus.DRAFT
            ? InvoiceStatus.SENT
            : invoice.status,
        sentAt: new Date(),
      },
    });

    // Here you would integrate with email service
    // For now, we'll just mark it as sent
    // await this.emailService.sendInvoice(invoice);

    return { message: "Invoice sent successfully" };
  }

  async getStatistics(filters?: {
    startDate?: Date;
    endDate?: Date;
    studentId?: string;
  }): Promise<InvoiceStatistics> {
    const where: Prisma.InvoiceWhereInput = {
      deletedAt: null,
    };

    if (filters?.startDate || filters?.endDate) {
      where.issuedDate = {};
      if (filters.startDate) {
        where.issuedDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.issuedDate.lte = filters.endDate;
      }
    }

    if (filters?.studentId) {
      where.studentId = filters.studentId;
    }

    const [invoices, statusGroups, typeGroups] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        select: {
          status: true,
          total: true,
        },
      }),
      this.prisma.invoice.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      this.prisma.invoice.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
    ]);

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
    const paidAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + inv.total, 0);
    const pendingAmount = invoices
      .filter(
        (inv) =>
          inv.status === InvoiceStatus.PENDING ||
          inv.status === InvoiceStatus.SENT
      )
      .reduce((sum, inv) => sum + inv.total, 0);
    const overdueAmount = invoices
      .filter((inv) => inv.status === InvoiceStatus.OVERDUE)
      .reduce((sum, inv) => sum + inv.total, 0);

    const statusBreakdown: any = {};
    statusGroups.forEach((group) => {
      statusBreakdown[group.status] = group._count;
    });

    const typeBreakdown: any = {};
    typeGroups.forEach((group) => {
      typeBreakdown[group.type] = group._count;
    });

    return {
      totalInvoices: invoices.length,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      statusBreakdown,
      typeBreakdown,
    };
  }

  async deleteInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice || invoice.deletedAt) {
      throw AppException.notFound(
        ErrorCode.INVOICE_NOT_FOUND,
        "Invoice not found"
      );
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw AppException.badRequest(
        ErrorCode.CANNOT_DELETE_PAID_INVOICE,
        "Cannot delete a paid invoice"
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
