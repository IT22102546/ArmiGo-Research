import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { ReconciliationStatus, ReconciliationType } from "@prisma/client";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

export interface ImportTrackerPlusDto {
  records: TrackerPlusRecord[];
}

export interface TrackerPlusRecord {
  referenceId: string;
  amount: number;
  date: string; // ISO date string
  studentId?: string;
  studentName?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreateReconciliationDto {
  trackerPlusRefId: string;
  trackerPlusAmount: number;
  trackerPlusDate: Date;
  trackerPlusStudentId?: string;
  trackerPlusStudentName?: string;
  trackerPlusDescription?: string;
  trackerPlusMetadata?: Record<string, any>;
}

export interface UpdateReconciliationDto {
  paymentId?: string;
  status?: ReconciliationStatus;
  type?: ReconciliationType;
  discrepancyAmount?: number;
  discrepancyReason?: string;
  notes?: string;
}

export interface ReconciliationFilterDto {
  status?: ReconciliationStatus;
  type?: ReconciliationType;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface ManualMatchDto {
  paymentId: string;
  notes?: string;
}

export interface BulkMatchDto {
  reconciliationIds: string[];
}

export interface ReconciliationStatistics {
  total: number;
  pending: number;
  matched: number;
  unmatched: number;
  disputed: number;
  resolved: number;
  totalTrackerPlusAmount: number;
  totalInternalAmount: number;
  totalDiscrepancy: number;
  byType: {
    autoMatched: number;
    manuallyMatched: number;
    unmatched: number;
    suspicious: number;
  };
}

@Injectable()
export class PaymentReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async importTrackerPlusData(data: ImportTrackerPlusDto, userId: string) {
    const results = {
      imported: 0,
      skipped: 0,
      autoMatched: 0,
      errors: [] as string[],
    };

    for (const record of data.records) {
      try {
        // Check if record already exists
        const existing = await this.prisma.paymentReconciliation.findUnique({
          where: { trackerPlusRefId: record.referenceId },
        });

        if (existing) {
          results.skipped++;
          continue;
        }

        // Try to auto-match with existing payments
        const matchedPayment = await this.findMatchingPayment(
          record.amount,
          new Date(record.date),
          record.studentId
        );

        const reconciliation = await this.prisma.paymentReconciliation.create({
          data: {
            trackerPlusRefId: record.referenceId,
            trackerPlusAmount: record.amount,
            trackerPlusDate: new Date(record.date),
            trackerPlusStudentId: record.studentId,
            trackerPlusStudentName: record.studentName,
            trackerPlusDescription: record.description,
            trackerPlusMetadata: record.metadata
              ? JSON.stringify(record.metadata)
              : null,
            paymentId: matchedPayment?.id,
            internalAmount: matchedPayment?.amount,
            internalDate: matchedPayment?.createdAt,
            status: matchedPayment
              ? ReconciliationStatus.MATCHED
              : ReconciliationStatus.PENDING,
            type: matchedPayment
              ? ReconciliationType.AUTO_MATCHED
              : ReconciliationType.UNMATCHED,
            matchedBy: matchedPayment ? userId : null,
            matchedAt: matchedPayment ? new Date() : null,
          },
        });

        results.imported++;
        if (matchedPayment) {
          results.autoMatched++;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(
          `Failed to import ${record.referenceId}: ${message}`
        );
      }
    }

    return results;
  }

  private async findMatchingPayment(
    amount: number,
    date: Date,
    studentId?: string
  ) {
    // Search for payments within 3 days of the TrackerPlus date
    const startDate = new Date(date);
    startDate.setDate(startDate.getDate() - 3);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 3);

    const payments = await this.prisma.payment.findMany({
      where: {
        amount,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
        reconciliation: null, // Not already reconciled
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
    });

    return payments[0] || null;
  }

  async getReconciliationList(filters: ReconciliationFilterDto) {
    const { page = 1, limit = 20, ...restFilters } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (restFilters.status) {
      where.status = restFilters.status;
    }

    if (restFilters.type) {
      where.type = restFilters.type;
    }

    if (restFilters.startDate || restFilters.endDate) {
      where.trackerPlusDate = {};
      if (restFilters.startDate) {
        where.trackerPlusDate.gte = restFilters.startDate;
      }
      if (restFilters.endDate) {
        where.trackerPlusDate.lte = restFilters.endDate;
      }
    }

    if (restFilters.minAmount || restFilters.maxAmount) {
      where.trackerPlusAmount = {};
      if (restFilters.minAmount) {
        where.trackerPlusAmount.gte = restFilters.minAmount;
      }
      if (restFilters.maxAmount) {
        where.trackerPlusAmount.lte = restFilters.maxAmount;
      }
    }

    if (restFilters.studentId) {
      where.trackerPlusStudentId = restFilters.studentId;
    }

    const [total, records] = await Promise.all([
      this.prisma.paymentReconciliation.count({ where }),
      this.prisma.paymentReconciliation.findMany({
        where,
        include: {
          payment: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          matcher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: {
          trackerPlusDate: "desc",
        },
      }),
    ]);

    return {
      data: records,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReconciliationById(id: string) {
    const reconciliation = await this.prisma.paymentReconciliation.findUnique({
      where: { id },
      include: {
        payment: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        matcher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!reconciliation) {
      throw AppException.notFound(
        ErrorCode.RECONCILIATION_NOT_FOUND,
        "Reconciliation record not found"
      );
    }

    return reconciliation;
  }

  async manualMatch(id: string, data: ManualMatchDto, userId: string) {
    const reconciliation = await this.getReconciliationById(id);

    if (reconciliation.status === ReconciliationStatus.MATCHED) {
      throw AppException.badRequest(
        ErrorCode.RECONCILIATION_ALREADY_MATCHED,
        "Reconciliation already matched"
      );
    }

    // Verify payment exists and is not already reconciled
    const payment = await this.prisma.payment.findUnique({
      where: { id: data.paymentId },
      include: { reconciliation: true },
    });

    if (!payment) {
      throw AppException.notFound(
        ErrorCode.PAYMENT_NOT_FOUND,
        "Payment not found"
      );
    }

    if (payment.reconciliation) {
      throw AppException.badRequest(
        ErrorCode.PAYMENT_ALREADY_RECONCILED,
        "Payment already reconciled"
      );
    }

    // Calculate discrepancy
    const discrepancyAmount = Math.abs(
      reconciliation.trackerPlusAmount - payment.amount
    );

    return this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        paymentId: payment.id,
        internalAmount: payment.amount,
        internalDate: payment.createdAt,
        status: ReconciliationStatus.MATCHED,
        type: ReconciliationType.MANUALLY_MATCHED,
        discrepancyAmount: discrepancyAmount > 0 ? discrepancyAmount : null,
        matchedBy: userId,
        matchedAt: new Date(),
        notes: data.notes,
      },
      include: {
        payment: {
          include: {
            user: true,
          },
        },
        matcher: true,
      },
    });
  }

  async unmatch(id: string) {
    const reconciliation = await this.getReconciliationById(id);

    if (reconciliation.status !== ReconciliationStatus.MATCHED) {
      throw AppException.badRequest(
        ErrorCode.RECONCILIATION_NOT_MATCHED,
        "Reconciliation is not matched"
      );
    }

    return this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        paymentId: null,
        internalAmount: null,
        internalDate: null,
        status: ReconciliationStatus.PENDING,
        type: ReconciliationType.UNMATCHED,
        discrepancyAmount: null,
        discrepancyReason: null,
        matchedBy: null,
        matchedAt: null,
      },
    });
  }

  async markSuspicious(id: string, reason: string, userId: string) {
    const reconciliation = await this.getReconciliationById(id);

    return this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.DISPUTED,
        type: ReconciliationType.SUSPICIOUS,
        discrepancyReason: reason,
        notes: `Marked as suspicious by user ${userId}: ${reason}`,
      },
    });
  }

  async resolve(id: string, notes: string, userId: string) {
    const reconciliation = await this.getReconciliationById(id);

    if (reconciliation.status !== ReconciliationStatus.DISPUTED) {
      throw AppException.badRequest(
        ErrorCode.RECONCILIATION_NOT_DISPUTED,
        "Only disputed reconciliations can be resolved"
      );
    }

    return this.prisma.paymentReconciliation.update({
      where: { id },
      data: {
        status: ReconciliationStatus.RESOLVED,
        notes: `${reconciliation.notes}\n\nResolved by user ${userId}: ${notes}`,
        matchedBy: userId,
        matchedAt: new Date(),
      },
    });
  }

  async bulkMatch(data: BulkMatchDto, userId: string) {
    const results = {
      matched: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const id of data.reconciliationIds) {
      try {
        const reconciliation =
          await this.prisma.paymentReconciliation.findUnique({
            where: { id },
          });

        if (!reconciliation) {
          results.errors.push(`Reconciliation ${id} not found`);
          results.failed++;
          continue;
        }

        // Try to find matching payment
        const matchedPayment = await this.findMatchingPayment(
          reconciliation.trackerPlusAmount,
          reconciliation.trackerPlusDate,
          reconciliation.trackerPlusStudentId || undefined
        );

        if (matchedPayment) {
          await this.prisma.paymentReconciliation.update({
            where: { id },
            data: {
              paymentId: matchedPayment.id,
              internalAmount: matchedPayment.amount,
              internalDate: matchedPayment.createdAt,
              status: ReconciliationStatus.MATCHED,
              type: ReconciliationType.AUTO_MATCHED,
              matchedBy: userId,
              matchedAt: new Date(),
            },
          });
          results.matched++;
        } else {
          results.errors.push(`No matching payment found for ${id}`);
          results.failed++;
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        results.errors.push(`Failed to match ${id}: ${message}`);
        results.failed++;
      }
    }

    return results;
  }

  async getStatistics(
    filters?: ReconciliationFilterDto
  ): Promise<ReconciliationStatistics> {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.trackerPlusDate = {};
      if (filters.startDate) {
        where.trackerPlusDate.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.trackerPlusDate.lte = filters.endDate;
      }
    }

    const [total, byStatus, byType, amounts] = await Promise.all([
      this.prisma.paymentReconciliation.count({ where }),
      this.prisma.paymentReconciliation.groupBy({
        by: ["status"],
        where,
        _count: true,
      }),
      this.prisma.paymentReconciliation.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
      this.prisma.paymentReconciliation.aggregate({
        where,
        _sum: {
          trackerPlusAmount: true,
          internalAmount: true,
          discrepancyAmount: true,
        },
      }),
    ]);

    const statusMap = byStatus.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count;
      return acc;
    }, {} as any);

    const typeMap = byType.reduce((acc, item) => {
      const key = item.type
        .split("_")
        .map((word, idx) => (idx === 0 ? word.toLowerCase() : word))
        .join("");
      acc[key] = item._count;
      return acc;
    }, {} as any);

    return {
      total,
      pending: statusMap.pending || 0,
      matched: statusMap.matched || 0,
      unmatched: statusMap.unmatched || 0,
      disputed: statusMap.disputed || 0,
      resolved: statusMap.resolved || 0,
      totalTrackerPlusAmount: amounts._sum.trackerPlusAmount || 0,
      totalInternalAmount: amounts._sum.internalAmount || 0,
      totalDiscrepancy: amounts._sum.discrepancyAmount || 0,
      byType: {
        autoMatched: typeMap.autoMatched || 0,
        manuallyMatched: typeMap.manuallyMatched || 0,
        unmatched: typeMap.unmatched || 0,
        suspicious: typeMap.suspicious || 0,
      },
    };
  }

  async getSuggestedMatches(id: string) {
    const reconciliation = await this.getReconciliationById(id);

    // Search for potential payment matches
    const startDate = new Date(reconciliation.trackerPlusDate);
    startDate.setDate(startDate.getDate() - 7); // 7 days before
    const endDate = new Date(reconciliation.trackerPlusDate);
    endDate.setDate(endDate.getDate() + 7); // 7 days after

    const suggestedPayments = await this.prisma.payment.findMany({
      where: {
        amount: {
          gte: reconciliation.trackerPlusAmount * 0.95, // Within 5% range
          lte: reconciliation.trackerPlusAmount * 1.05,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: "COMPLETED",
        reconciliation: null,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return suggestedPayments.map((payment) => ({
      ...payment,
      matchScore: this.calculateMatchScore(reconciliation, payment),
    }));
  }

  private calculateMatchScore(reconciliation: any, payment: any): number {
    let score = 0;

    // Amount match (40 points)
    const amountDiff = Math.abs(
      reconciliation.trackerPlusAmount - payment.amount
    );
    const amountDiffPercent =
      (amountDiff / reconciliation.trackerPlusAmount) * 100;
    if (amountDiffPercent === 0) {score += 40;}
    else if (amountDiffPercent < 1) {score += 35;}
    else if (amountDiffPercent < 5) {score += 25;}

    // Date match (40 points)
    const dateDiff = Math.abs(
      new Date(reconciliation.trackerPlusDate).getTime() -
        new Date(payment.createdAt).getTime()
    );
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    if (daysDiff === 0) {score += 40;}
    else if (daysDiff < 1) {score += 35;}
    else if (daysDiff < 3) {score += 25;}
    else if (daysDiff < 7) {score += 15;}

    // Student ID match (20 points) - Currently not available as User model lacks admissionNumber
    // This can be implemented once admissionNumber field is added to User model

    return score;
  }
}
