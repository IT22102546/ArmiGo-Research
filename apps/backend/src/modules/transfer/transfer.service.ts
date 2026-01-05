import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { RoleHelper } from "../../shared/helpers/role.helper";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";
import {
  CreateMutualTransferDto,
  AcceptTransferDto,
  VerifyTransferDto,
  TransferRequestResponseDto,
  TransferMatchDto,
  TransferStatsDto,
  TransferRequestStatus,
  TransferRequestLimitedDto,
  TransferRequestFullDto,
  BrowseTransferFiltersDto,
} from "./dto/transfer.dto";
import { UserRole } from "@prisma/client";
import { NotificationsService } from "../notifications/notifications.service";
import { TransferPrivacyService } from "./services/transfer-privacy.service";

@Injectable()
export class TransferService {
  private readonly logger = new Logger(TransferService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private privacyService: TransferPrivacyService,
  ) {}

  /**
   * Create a new mutual transfer request
   */
  async createMutualTransfer(
    dto: CreateMutualTransferDto,
    userId: string
  ): Promise<TransferRequestResponseDto> {
    // Check if user already has a pending/verified/accepted request
    const existingRequest = await this.prisma.transferRequest.findFirst({
      where: {
        requesterId: userId,
        status: {
          in: [
            TransferRequestStatus.PENDING,
            TransferRequestStatus.VERIFIED,
            TransferRequestStatus.MATCHED,
          ],
        },
      },
    });

    if (existingRequest) {
      throw AppException.badRequest(ErrorCode.ACTIVE_TRANSFER_EXISTS);
    }

    // Generate unique ID (e.g., TR-2025-00001)
    const year = new Date().getFullYear();
    const count = await this.prisma.transferRequest.count();
    const uniqueId = `TR-${year}-${String(count + 1).padStart(5, "0")}`;

    // Lookup fromZone by name to get ID
    const fromZone = await this.prisma.zone.findFirst({
      where: {
        OR: [
          { name: { equals: dto.fromZone, mode: "insensitive" } },
          { code: { equals: dto.fromZone, mode: "insensitive" } },
        ],
      },
    });
    if (!fromZone) {
      throw AppException.badRequest(
        ErrorCode.ZONE_NOT_FOUND,
        `Zone '${dto.fromZone}' not found`
      );
    }

    // Lookup current district by name to get ID
    let currentDistrictId: string | undefined;
    if (dto.currentDistrict) {
      const district = await this.prisma.district.findFirst({
        where: {
          OR: [
            { name: { equals: dto.currentDistrict, mode: "insensitive" } },
            { code: { equals: dto.currentDistrict, mode: "insensitive" } },
          ],
        },
      });
      if (district) {currentDistrictId = district.id;}
    }

    // Lookup subject and medium by name to get IDs
    let subjectId: string | undefined;
    let mediumId: string | undefined;

    if (dto.subject) {
      const subject = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { name: { equals: dto.subject, mode: "insensitive" } },
            { code: { equals: dto.subject, mode: "insensitive" } },
          ],
        },
      });
      if (subject) {subjectId = subject.id;}
    }

    if (dto.medium) {
      const medium = await this.prisma.medium.findFirst({
        where: { name: { equals: dto.medium, mode: "insensitive" } },
      });
      if (medium) {mediumId = medium.id;}
    }

    if (!subjectId) {
      throw AppException.badRequest(ErrorCode.SUBJECT_REQUIRED);
    }
    if (!mediumId) {
      throw AppException.badRequest(ErrorCode.MEDIUM_REQUIRED_TRANSFER);
    }

    const request = await this.prisma.transferRequest.create({
      data: {
        uniqueId,
        requesterId: userId,
        fromZoneId: fromZone.id,
        currentDistrictId,
        subjectId,
        mediumId,
        level: dto.level,
        currentSchool: dto.currentSchool,
        currentSchoolType: dto.currentSchoolType,
        yearsOfService: dto.yearsOfService,
        qualifications: dto.qualifications || [],
        isInternalTeacher: dto.isInternalTeacher ?? true,
        preferredSchoolTypes: dto.preferredSchoolTypes || [],
        additionalRequirements: dto.additionalRequirements,
        notes: dto.notes,
        attachments: dto.attachments || [],
        desiredZones: {
          create: dto.toZones.map((zoneName, index) => ({
            zone: {
              connect: {
                name: zoneName,
              },
            },
            priority: index + 1,
          })),
        },
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentDistrict: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
    });

    // Notify admins about new transfer request
    try {
      await this.notificationsService.notifyAdmins({
        title: "New Mutual Transfer Request",
        message: `A new mutual transfer request (${request.uniqueId}) has been submitted and requires verification.`,
        type: "SYSTEM",
        priority: "NORMAL",
        metadata: {
          transferRequestId: request.id,
          uniqueId: request.uniqueId,
          action: "transfer_request_created",
          actionUrl: `/admin/transfers/${request.id}`,
        },
      });
    } catch (error) {
      this.logger.error(
        "Failed to notify admins about new transfer request",
        error
      );
    }

    return this.mapToResponseDto(request);
  }

  /**
   * Get user's own mutual transfer requests
   */
  async getMyRequests(userId: string): Promise<TransferRequestResponseDto[]> {
    const requests = await this.prisma.transferRequest.findMany({
      where: {
        requesterId: userId,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => this.mapToResponseDto(r));
  }

  /**
   * Get all transfer requests with filters (Admin only)
   */
  async getAllTransfers(
    filters: BrowseTransferFiltersDto
  ): Promise<TransferRequestResponseDto[]> {
    const where: any = {};

    // Filter by status
    if (filters.status) {
      where.status = filters.status;
    }

    // Filter by zone
    if (filters.fromZone) {
      where.fromZone = {
        OR: [
          { name: { equals: filters.fromZone, mode: "insensitive" } },
          { code: { equals: filters.fromZone, mode: "insensitive" } },
        ],
      };
    }

    // Filter by subject
    if (filters.subject) {
      where.subject = {
        OR: [
          { name: { equals: filters.subject, mode: "insensitive" } },
          { code: { equals: filters.subject, mode: "insensitive" } },
        ],
      };
    }

    // Filter by medium
    if (filters.medium) {
      where.medium = {
        name: { equals: filters.medium, mode: "insensitive" },
      };
    }

    // Filter by level
    if (filters.level) {
      where.level = filters.level;
    }

    // Filter by verification status
    if (filters.verifiedOnly !== undefined) {
      where.verified = filters.verifiedOnly;
    }

    const requests = await this.prisma.transferRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        acceptances: {
          include: {
            acceptor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => this.mapToResponseDto(r));
  }

  /**
   * Get transfer request by ID
   */
  async findOne(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        acceptances: {
          include: {
            acceptor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    // Check permissions
    const isRequester = request.requesterId === userId;
    const isAcceptor = request.acceptances.some(
      (acc) => acc.acceptorId === userId
    );
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isRequester && !isAcceptor && !isAdmin) {
      throw AppException.forbidden(ErrorCode.CANNOT_VIEW_TRANSFER);
    }

    return this.mapToResponseDto(request, userId);
  }

  /**
   * Cancel transfer request
   */
  async cancel(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    // Only requester can cancel their own request
    if (existing.requesterId !== userId) {
      throw AppException.forbidden(ErrorCode.ONLY_OWNERS_CAN_CANCEL);
    }

    // Cannot cancel if already completed
    if (existing.status === TransferRequestStatus.COMPLETED) {
      throw AppException.badRequest(ErrorCode.CANNOT_CANCEL_COMPLETED_TRANSFER);
    }

    await this.prisma.transferRequest.update({
      where: { id },
      data: {
        status: TransferRequestStatus.CANCELLED,
      },
    });
  }

  /**
   * Find matching transfer requests
   */
  async findMatches(userId: string): Promise<TransferMatchDto[]> {
    // Get user's transfer request with relations
    const myRequest = await this.prisma.transferRequest.findFirst({
      where: {
        requesterId: userId,
        status: {
          in: [TransferRequestStatus.PENDING, TransferRequestStatus.VERIFIED],
        },
      },
      include: {
        fromZone: true,
        subject: true,
        medium: true,
        desiredZones: {
          include: {
            zone: true,
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
    });

    if (!myRequest) {
      return [];
    }

    // Extract zone IDs from my desired zones for filtering
    const myDesiredZoneIds = myRequest.desiredZones.map((dz) => dz.zoneId);

    // Find potential matches
    // Match criteria: Their fromZone is in my desiredZones AND my fromZone is in their desiredZones
    const potentialMatches = await this.prisma.transferRequest.findMany({
      where: {
        id: { not: myRequest.id },
        status: TransferRequestStatus.VERIFIED,
        verified: true,
        // Their fromZone should be one of my desired zones
        fromZoneId: { in: myDesiredZoneIds },
        // My fromZone should be in their desired zones
        desiredZones: {
          some: {
            zoneId: myRequest.fromZoneId || undefined,
          },
        },
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        fromZone: true,
        subject: true,
        medium: true,
        desiredZones: {
          include: {
            zone: true,
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
    });

    // Calculate match score (zones 50, subject 20, medium 15, level 15) — logic below computes this
    const matches: TransferMatchDto[] = potentialMatches.map((match) => {
      let score = 0;

      // Zone compatibility scoring (50 points max)
      // Perfect swap: Their fromZone is my first preference AND my fromZone is their first preference
      const myFirstChoice = myRequest.desiredZones[0]?.zoneId;
      const theirFirstChoice = match.desiredZones[0]?.zoneId;

      const perfectSwap =
        match.fromZoneId === myFirstChoice &&
        myRequest.fromZoneId === theirFirstChoice;

      if (perfectSwap) {
        score += 50; // Perfect mutual zone swap
      } else {
        // Partial zone compatibility
        // Their fromZone is in my desiredZones list
        if (match.fromZoneId && myDesiredZoneIds.includes(match.fromZoneId)) {
          score += 25;
        }
        // My fromZone is in their desiredZones list
        const theyWantMyZone =
          match.desiredZones?.some(
            (dz: { zoneId: string }) => dz.zoneId === myRequest.fromZoneId
          ) || false;
        if (theyWantMyZone) {
          score += 25;
        }
      }

      // Subject match (20 points)
      if (match.subjectId === myRequest.subjectId) {
        score += 20;
      }

      // Medium match (15 points)
      if (match.mediumId === myRequest.mediumId) {
        score += 15;
      }

      // Level match (15 points)
      if (match.level === myRequest.level) {
        score += 15;
      }

      return {
        id: match.id,
        uniqueId: match.uniqueId,
        requester: {
          id: match.requester?.id || "",
          firstName: match.requester?.firstName || "",
          lastName: match.requester?.lastName || "",
        },
        fromZone: match.fromZone?.name || "",
        toZones:
          match.desiredZones
            ?.map((dz: { zone: { name: string } }) => dz.zone?.name || "")
            .filter(Boolean) || [],
        subject: match.subject?.name || "",
        medium: match.medium?.name || "",
        level: match.level,

        // Enhanced fields
        currentSchool: match.currentSchool,
        currentSchoolType: match.currentSchoolType,
        yearsOfService: match.yearsOfService,
        qualifications: match.qualifications || [],
        isInternalTeacher: match.isInternalTeacher,

        matchScore: score,
        verified: match.verified,
        createdAt: match.createdAt,
      };
    });

    // Sort by match score descending (highest matches first)
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Accept a transfer match
   */
  async acceptTransfer(
    id: string,
    dto: AcceptTransferDto,
    userId: string
  ): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
      include: {
        requester: true,
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    if (!request.verified) {
      throw AppException.badRequest(ErrorCode.CANNOT_ACCEPT_UNVERIFIED);
    }

    if (request.status !== TransferRequestStatus.VERIFIED) {
      throw AppException.badRequest(ErrorCode.TRANSFER_NOT_AVAILABLE);
    }

    // Check if my request matches with theirs
    const myRequest = await this.prisma.transferRequest.findFirst({
      where: {
        requesterId: userId,
        status: TransferRequestStatus.VERIFIED,
      },
      include: {
        fromZone: true,
        subject: true,
        medium: true,
        desiredZones: {
          include: {
            zone: true,
          },
        },
      },
    });

    if (!myRequest) {
      throw AppException.badRequest(
        ErrorCode.CANNOT_ACCEPT_UNVERIFIED,
        "You must have a verified transfer request to accept matches"
      );
    }

    // Verify compatibility - ensure zones, subject, medium, and level match
    const myDesiredZoneIds = myRequest.desiredZones.map((dz) => dz.zoneId);
    const requestDesiredZones =
      await this.prisma.transferRequestDesiredZone.findMany({
        where: {
          transferRequestId: request.id,
        },
      });
    const requestDesiredZoneIds = requestDesiredZones.map((dz) => dz.zoneId);

    const compatible =
      myRequest.subjectId === request.subjectId &&
      myRequest.mediumId === request.mediumId &&
      myRequest.level === request.level &&
      myRequest.fromZoneId &&
      request.fromZoneId &&
      myDesiredZoneIds.includes(request.fromZoneId) &&
      myRequest.fromZoneId &&
      requestDesiredZoneIds.includes(myRequest.fromZoneId);

    if (!compatible) {
      throw AppException.badRequest(
        ErrorCode.PROFILE_MISMATCH,
        "Transfer requests are not compatible. Zone, subject, medium, and level must match."
      );
    }

    // Use transaction to update both requests and create acceptances
    await this.prisma.$transaction([
      // Update the accepted request
      this.prisma.transferRequest.update({
        where: { id: request.id },
        data: {
          status: TransferRequestStatus.MATCHED,
          acceptanceNotes: dto.notes,
        },
      }),
      // Create acceptance from me to the request
      this.prisma.transferAcceptance.create({
        data: {
          transferRequestId: request.id,
          acceptorId: userId,
          status: "APPROVED" as any,
          notes: dto.notes,
          acceptedAt: new Date(),
        },
      }),
      // Update my request
      this.prisma.transferRequest.update({
        where: { id: myRequest.id },
        data: {
          status: TransferRequestStatus.MATCHED,
        },
      }),
      // Create acceptance from requester to my request
      this.prisma.transferAcceptance.create({
        data: {
          transferRequestId: myRequest.id,
          acceptorId: request.requesterId,
          status: "APPROVED" as any,
          acceptedAt: new Date(),
        },
      }),
    ]);

    // Notify both parties and admins about the match
    try {
      // Notify the other teacher
      await this.notificationsService.createNotification({
        userId: request.requesterId,
        type: "SYSTEM",
        title: "Transfer Match Confirmed!",
        message: `Your mutual transfer request (${request.uniqueId}) has been matched. You can now exchange contact details and coordinate the transfer.`,
        metadata: {
          transferRequestId: request.id,
          uniqueId: request.uniqueId,
          action: "transfer_matched",
          actionUrl: `/teacher/transfers`,
        },
        sendRealtime: true,
        priority: "HIGH",
      });

      // Notify admins about the match
      await this.notificationsService.notifyAdmins({
        title: "Transfer Match Created",
        message: `A mutual transfer match has been confirmed. Requests ${request.uniqueId} and ${myRequest.uniqueId} are now matched.`,
        type: "SYSTEM",
        priority: "NORMAL",
        metadata: {
          transferRequestId: request.id,
          matchedRequestId: myRequest.id,
          action: "transfer_match_created",
          actionUrl: `/admin/transfers/${request.id}`,
        },
      });
    } catch (error) {
      this.logger.error("Failed to send match notifications", error);
    }

    // Return the updated request
    return this.findOne(request.id, userId, RoleHelper.getAllTeacherRoles()[0]);
  }

  /**
   * Verify transfer request (Admin only)
   */
  async verify(
    id: string,
    dto: VerifyTransferDto,
    adminId: string
  ): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id },
      data: {
        verified: dto.verified,
        status: dto.verified
          ? TransferRequestStatus.VERIFIED
          : TransferRequestStatus.PENDING,
        verifiedBy: adminId,
        verifiedAt: new Date(),
        verificationNotes: dto.verificationNotes,
      },
      include: {
        requester: {
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

    // Notify requester about verification status
    try {
      await this.notificationsService.createNotification({
        userId: updated.requesterId,
        type: "SYSTEM",
        title: dto.verified
          ? "Transfer Request Verified"
          : "Transfer Request Needs Review",
        message: dto.verified
          ? `Your mutual transfer request (${updated.uniqueId}) has been verified and is now visible to other teachers.`
          : `Your mutual transfer request (${updated.uniqueId}) requires additional information. ${dto.verificationNotes || ""}`,
        metadata: {
          transferRequestId: updated.id,
          uniqueId: updated.uniqueId,
          action: dto.verified
            ? "transfer_request_verified"
            : "transfer_request_needs_review",
          actionUrl: `/teacher/transfers`,
        },
        sendRealtime: true,
      });
    } catch (error) {
      this.logger.error("Failed to notify about transfer verification", error);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Mark transfer as completed (Admin only)
   */
  async complete(id: string): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    if (request.status !== TransferRequestStatus.MATCHED) {
      throw AppException.badRequest(ErrorCode.CAN_ONLY_COMPLETE_MATCHED);
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id },
      data: {
        status: TransferRequestStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        acceptances: {
          include: {
            acceptor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        fromZone: true,
        subject: true,
        medium: true,
        desiredZones: {
          include: {
            zone: true,
          },
        },
      },
    });

    // Notify both parties about completion
    try {
      // Notify the requester
      await this.notificationsService.createNotification({
        userId: updated.requesterId,
        type: "SYSTEM",
        title: "Transfer Completed!",
        message: `Congratulations! Your mutual transfer (${updated.uniqueId}) has been officially completed. Your transfer process is now finalized.`,
        metadata: {
          transferRequestId: updated.id,
          uniqueId: updated.uniqueId,
          action: "transfer_completed",
          actionUrl: `/teacher/transfers`,
        },
        sendRealtime: true,
        priority: "HIGH",
      });

      // Notify all acceptors (matched parties)
      for (const acceptance of updated.acceptances) {
        await this.notificationsService.createNotification({
          userId: acceptance.acceptorId,
          type: "SYSTEM",
          title: "Transfer Completed!",
          message: `Congratulations! Your mutual transfer has been officially completed. Your transfer process is now finalized.`,
          metadata: {
            transferRequestId: updated.id,
            uniqueId: updated.uniqueId,
            action: "transfer_completed",
            actionUrl: `/teacher/transfers`,
          },
          sendRealtime: true,
          priority: "HIGH",
        });
      }
    } catch (error) {
      this.logger.error("Failed to send completion notifications", error);
    }

    return this.mapToResponseDto(updated);
  }

  /**
   * Get transfer statistics (Admin only)
   */
  async getStats(): Promise<TransferStatsDto> {
    const [
      total,
      pending,
      verified,
      matched,
      completed,
      cancelled,
      allRequests,
    ] = await Promise.all([
      this.prisma.transferRequest.count(),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.PENDING },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.VERIFIED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.MATCHED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.COMPLETED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.CANCELLED },
      }),
      this.prisma.transferRequest.findMany({
        select: {
          createdAt: true,
          completedAt: true,
          fromZoneId: true,
          subjectId: true,
          status: true,
        },
      }),
    ]);

    // Calculate average match time
    const completedRequests = allRequests.filter((r) => r.completedAt);
    const averageMatchTime =
      completedRequests.length > 0
        ? completedRequests.reduce((sum, r) => {
            const days = Math.floor(
              (r.completedAt!.getTime() - r.createdAt.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return sum + days;
          }, 0) / completedRequests.length
        : 0;

    // Group by zone ID
    const zoneMap: Record<string, { requests: number; completed: number }> = {};
    allRequests.forEach((r) => {
      const zoneId = r.fromZoneId;
      if (zoneId) {
        if (!zoneMap[zoneId]) {
          zoneMap[zoneId] = { requests: 0, completed: 0 };
        }
        zoneMap[zoneId].requests++;
        if (r.status === TransferRequestStatus.COMPLETED) {
          zoneMap[zoneId].completed++;
        }
      }
    });

    // Group by subject ID
    const subjectMap: Record<string, { requests: number; completed: number }> =
      {};
    allRequests.forEach((r) => {
      const subjectId = r.subjectId;
      if (subjectId) {
        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = { requests: 0, completed: 0 };
        }
        subjectMap[subjectId].requests++;
        if (r.status === TransferRequestStatus.COMPLETED) {
          subjectMap[subjectId].completed++;
        }
      }
    });

    return {
      totalRequests: total,
      pendingRequests: pending,
      verifiedRequests: verified,
      matchedRequests: matched,
      completedRequests: completed,
      cancelledRequests: cancelled,
      averageMatchTime: Math.round(averageMatchTime),
      byZone: Object.entries(zoneMap).map(([zone, data]) => ({
        zone,
        ...data,
      })),
      bySubject: Object.entries(subjectMap).map(([subject, data]) => ({
        subject,
        ...data,
      })),
    };
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponseDto(
    transfer_requests: any,
    viewerId?: string
  ): TransferRequestResponseDto {
    return {
      id: transfer_requests.id,
      uniqueId: transfer_requests.uniqueId,
      requesterId: transfer_requests.requesterId,
      requester:
        transfer_requests.users_transfer_requests_requesterIdTousers ||
        transfer_requests.requester,
      fromZone: transfer_requests.fromZone?.name || "",
      toZones:
        transfer_requests.desiredZones
          ?.map((dz: any) => dz.zone?.name || "")
          .filter(Boolean) || [],
      subject: transfer_requests.subject?.name || "",
      medium: transfer_requests.medium?.name || "",
      level: transfer_requests.level,

      // Enhanced fields
      currentSchool: transfer_requests.currentSchool,
      currentSchoolType: transfer_requests.currentSchoolType,
      currentDistrict: transfer_requests.currentDistrict?.name,
      yearsOfService: transfer_requests.yearsOfService,
      qualifications: transfer_requests.qualifications || [],
      isInternalTeacher: transfer_requests.isInternalTeacher,
      preferredSchoolTypes: transfer_requests.preferredSchoolTypes || [],
      additionalRequirements: transfer_requests.additionalRequirements,

      receiverId: transfer_requests.receiverId,
      receiver:
        transfer_requests.users_transfer_requests_receiverIdTousers ||
        transfer_requests.receiver,
      status: transfer_requests.status,
      verified: transfer_requests.verified,
      verifiedBy: transfer_requests.verifiedBy,
      verifiedAt: transfer_requests.verifiedAt,
      verificationNotes: transfer_requests.verificationNotes,
      notes: transfer_requests.notes,
      attachments: transfer_requests.attachments,
      createdAt: transfer_requests.createdAt,
      updatedAt: transfer_requests.updatedAt,
      completedAt: transfer_requests.completedAt,
      acceptanceNotes: transfer_requests.acceptanceNotes,
    };
  }

  // ============================================
  // Progressive Information Disclosure
  // ============================================

  /**
   * Browse transfer requests with limited information (before sending request)
   */
  async browseRequests(
    filters: BrowseTransferFiltersDto,
    userId: string
  ): Promise<{
    requests: TransferRequestLimitedDto[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = parseInt(filters.page || "1");
    const limit = parseInt(filters.limit || "20");
    const skip = (page - 1) * limit;

    const where: any = {
      // Only show verified requests
      verified: filters.verifiedOnly !== false ? true : undefined,
      // Don't show own requests
      requesterId: { not: userId },
      // Only show pending/verified requests (not accepted by someone else)
      status: {
        in: [TransferRequestStatus.PENDING, TransferRequestStatus.VERIFIED],
      },
    };

    if (filters.fromZone) {
      // Lookup zone by name to get ID
      const zone = await this.prisma.zone.findFirst({
        where: {
          OR: [
            { name: { equals: filters.fromZone, mode: "insensitive" } },
            { code: { equals: filters.fromZone, mode: "insensitive" } },
          ],
        },
      });
      if (zone) {
        where.fromZoneId = zone.id;
      }
    }

    if (filters.toZones && filters.toZones.length > 0) {
      // Lookup zones by name to get IDs
      const zones = await this.prisma.zone.findMany({
        where: {
          OR: filters.toZones.map((zoneName) => ({
            name: { equals: zoneName, mode: "insensitive" as const },
          })),
        },
      });
      const zoneIds = zones.map((z) => z.id);
      if (zoneIds.length > 0) {
        where.desiredZones = {
          some: {
            zoneId: { in: zoneIds },
          },
        };
      }
    }

    if (filters.subject) {
      // Lookup subject by name to get ID
      const subject = await this.prisma.subject.findFirst({
        where: {
          OR: [
            { name: { equals: filters.subject, mode: "insensitive" } },
            { code: { equals: filters.subject, mode: "insensitive" } },
          ],
        },
      });
      if (subject) {
        where.subjectId = subject.id;
      }
    }

    if (filters.medium) {
      // Lookup medium by name to get ID
      const medium = await this.prisma.medium.findFirst({
        where: { name: { equals: filters.medium, mode: "insensitive" } },
      });
      if (medium) {
        where.mediumId = medium.id;
      }
    }

    if (filters.level) {
      where.level = filters.level;
    }

    // Enhanced filters
    if (filters.currentDistrict) {
      const district = await this.prisma.district.findFirst({
        where: {
          OR: [
            { name: { equals: filters.currentDistrict, mode: "insensitive" } },
            { code: { equals: filters.currentDistrict, mode: "insensitive" } },
          ],
        },
      });
      if (district) {
        where.currentDistrictId = district.id;
      }
    }

    if (filters.currentSchoolType) {
      where.currentSchoolType = filters.currentSchoolType;
    }

    if (filters.isInternalTeacher !== undefined) {
      where.isInternalTeacher = filters.isInternalTeacher;
    }

    if (filters.minYearsOfService !== undefined) {
      where.yearsOfService = { gte: filters.minYearsOfService };
    }

    if (
      filters.preferredSchoolTypes &&
      filters.preferredSchoolTypes.length > 0
    ) {
      where.preferredSchoolTypes = {
        hasSome: filters.preferredSchoolTypes,
      };
    }

    const [requests, total] = await Promise.all([
      this.prisma.transferRequest.findMany({
        where,
        include: {
          requester: {
            select: {
              firstName: true,
            },
          },
          fromZone: {
            select: {
              id: true,
              name: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          medium: {
            select: {
              id: true,
              name: true,
            },
          },
          desiredZones: {
            include: {
              zone: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
            orderBy: {
              priority: "asc",
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.transferRequest.count({ where }),
    ]);

    const limitedRequests: TransferRequestLimitedDto[] = requests.map((r) => ({
      id: r.id,
      uniqueId: r.uniqueId,
      fromZone: r.fromZone?.name || "N/A",
      toZones: r.desiredZones.map((dz) => dz.zone?.name || "N/A"),
      subject: r.subject?.name || "N/A",
      medium: r.medium?.name || "N/A",
      level: r.level,
      verified: r.verified,
      createdAt: r.createdAt,
      requester: {
        firstName: r.requester.firstName,
        subject: r.subject?.name || "N/A",
        level: r.level,
      },
    }));

    return {
      requests: limitedRequests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get transfer request with visibility rules applied
   */
  async getRequestWithVisibility(
    requestId: string,
    viewerId: string
  ): Promise<TransferRequestLimitedDto | TransferRequestFullDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: requestId },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
        acceptances: {
          include: {
            acceptor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    const isRequester = request.requesterId === viewerId;
    const hasAcceptances =
      request.acceptances && request.acceptances.length > 0;
    const isAcceptor = request.acceptances?.some(
      (acc: any) => acc.acceptorId === viewerId
    );

    // Rule 1: Before request is sent (browsing) - Limited info
    if (!hasAcceptances && !isRequester) {
      return {
        id: request.id,
        uniqueId: request.uniqueId,
        fromZone: request.fromZone?.name || "",
        toZones:
          request.desiredZones?.map((dz: any) => dz.zone?.name || "") || [],
        subject: request.subject?.name || "",
        medium: request.medium?.name || "",
        level: request.level,
        verified: request.verified,
        createdAt: request.createdAt,
        requester: {
          firstName: request.requester?.firstName || "",
          subject: request.subject?.name || "",
          level: request.level,
        },
      } as any;
    }

    // Rule 2: After matching - Both parties see full info
    if (
      request.status === TransferRequestStatus.MATCHED &&
      (isRequester || isAcceptor)
    ) {
      return this.mapToFullDto(request, true, true);
    }

    // Requester always sees their own full info
    if (isRequester) {
      return this.mapToFullDto(request, true, hasAcceptances);
    }

    // Default: Limited info
    return {
      id: request.id,
      uniqueId: request.uniqueId,
      fromZone: request.fromZone?.name || "",
      toZones:
        request.desiredZones?.map((dz: any) => dz.zone?.name || "") || [],
      subject: request.subject?.name || "",
      medium: request.medium?.name || "",
      level: request.level,
      verified: request.verified,
      createdAt: request.createdAt,
      requester: {
        firstName: request.requester?.firstName || "",
        subject: request.subject?.name || "",
        level: request.level,
      },
    } as any;
  }

  /**
   * Map to full DTO with conditional receiver information
   */
  private mapToFullDto(
    request: any,
    showRequesterFull: boolean,
    showReceiverFull: boolean
  ): TransferRequestFullDto {
    const fullDto: any = {
      id: request.id,
      uniqueId: request.uniqueId,
      fromZone: request.fromZone?.name || "",
      toZones:
        request.desiredZones
          ?.map((dz: any) => dz.zone?.name || "")
          .filter(Boolean) || [],
      subject: request.subject?.name || "",
      medium: request.medium?.name || "",
      level: request.level,
      notes: request.notes,
      acceptanceNotes: request.acceptanceNotes,
      attachments: request.attachments,
      verified: request.verified,
      status: request.status,
      createdAt: request.createdAt,
      completedAt: request.completedAt,
    };

    if (showRequesterFull && request.requester) {
      fullDto.requester = {
        id: request.requester.id,
        firstName: request.requester.firstName,
        lastName: request.requester.lastName,
        email: request.requester.email,
        phone: request.requester.phone,
        subject: request.subject?.name || "",
        level: request.level,
      };
    } else {
      fullDto.requester = {
        firstName: request.requester?.firstName || "",
        subject: request.subject?.name || "",
        level: request.level,
      };
    }

    if (showReceiverFull) {
      // Try to derive receiver from acceptances if available (new schema)
      const accepted =
        request.acceptances?.find((acc: any) => acc.status === "APPROVED") ||
        request.acceptances?.[0];
      if (accepted && accepted.acceptor) {
        fullDto.receiver = {
          id: accepted.acceptor.id,
          firstName: accepted.acceptor.firstName,
          lastName: accepted.acceptor.lastName,
          email: accepted.acceptor.email,
          phone: accepted.acceptor.phone,
          subject: request.subject?.name || "",
          level: request.level,
        };
      }
    }

    return fullDto as TransferRequestFullDto;
  }

  // ============ NEW ADMIN METHODS ============

  /**
   * Get all transfer requests with pagination and filters (Admin only)
   */
  async getAllAdminPaginated(filters: {
    page: number;
    limit: number;
    status?: TransferRequestStatus;
    fromZoneId?: string;
    subjectId?: string;
    mediumId?: string;
    level?: string;
    searchTerm?: string;
  }) {
    const {
      page,
      limit,
      status,
      fromZoneId,
      subjectId,
      mediumId,
      level,
      searchTerm,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (fromZoneId) {
      where.fromZoneId = fromZoneId;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    if (mediumId) {
      where.mediumId = mediumId;
    }

    if (level) {
      where.level = level;
    }

    if (searchTerm) {
      where.OR = [
        { uniqueId: { contains: searchTerm, mode: "insensitive" } },
        { currentSchool: { contains: searchTerm, mode: "insensitive" } },
        {
          requester: {
            firstName: { contains: searchTerm, mode: "insensitive" },
          },
        },
        {
          requester: {
            lastName: { contains: searchTerm, mode: "insensitive" },
          },
        },
        { requester: { email: { contains: searchTerm, mode: "insensitive" } } },
      ];
    }

    const [requests, total] = await Promise.all([
      this.prisma.transferRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          requester: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          fromZone: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          medium: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          desiredZones: {
            include: {
              zone: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
            orderBy: {
              priority: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      this.prisma.transferRequest.count({ where }),
    ]);

    const data = requests.map((request) => ({
      id: request.id,
      uniqueId: request.uniqueId,
      status: request.status,
      verified: request.verified,
      currentSchool: request.currentSchool,
      currentSchoolType: request.currentSchoolType,
      level: request.level,
      yearsOfService: request.yearsOfService,
      isInternalTeacher: request.isInternalTeacher,
      createdAt: request.createdAt,
      requester: request.requester,
      fromZone: request.fromZone.name,
      subject: request.subject.name,
      medium: request.medium.name,
      toZones: request.desiredZones.map((dz) => dz.zone.name),
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get detailed transfer request information (Admin only)
   */
  async getDetailAdmin(id: string) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            role: true,
            teacherProfile: {
              select: {
                qualifications: true,
                experience: true,
              },
            },
          },
        },
        fromZone: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        currentDistrict: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        medium: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        desiredZones: {
          include: {
            zone: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            priority: "asc",
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    return {
      ...request,
      fromZone: request.fromZone.name,
      subject: request.subject.name,
      medium: request.medium.name,
    };
  }

  /**
   * Verify transfer request (Admin only)
   */
  async verifyTransferAdmin(
    id: string,
    notes: string | undefined,
    verifiedBy: string
  ) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    if (request.verified) {
      throw AppException.badRequest(ErrorCode.TRANSFER_ALREADY_VERIFIED);
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id },
      data: {
        verified: true,
        verifiedBy,
        verifiedAt: new Date(),
        verificationNotes: notes,
        status: TransferRequestStatus.VERIFIED,
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: "Transfer request verified successfully",
      request: updated,
    };
  }

  /**
   * Update transfer request status (Admin only)
   */
  async updateStatusAdmin(
    id: string,
    status: TransferRequestStatus,
    notes: string | undefined,
    updatedBy: string
  ) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    const updateData: any = {
      status,
    };

    if (notes) {
      updateData.notes = notes;
    }

    if (status === TransferRequestStatus.COMPLETED) {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id },
      data: updateData,
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: "Transfer request status updated successfully",
      request: updated,
    };
  }

  // ============================================
  // Messaging Methods
  // ============================================

  /**
   * Get all messages for a transfer request
   * Only the requester or the matched receiver can view messages
   */
  async getMessages(transferRequestId: string, userId: string) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: {
        acceptances: true,
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    // Check if user is authorized to view messages
    const isRequester = request.requesterId === userId;
    const isMatchedParty = request.acceptances.some(
      (a) => a.acceptorId === userId || request.requesterId === userId
    );

    if (!isRequester && !isMatchedParty) {
      throw AppException.forbidden(ErrorCode.CANNOT_VIEW_TRANSFER);
    }

    const messages = await this.prisma.transferMessage.findMany({
      where: { transferRequestId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return messages.map((msg) => ({
      id: msg.id,
      transferRequestId: msg.transferRequestId,
      senderId: msg.senderId,
      sender: msg.sender,
      content: msg.content,
      read: msg.read,
      createdAt: msg.createdAt,
    }));
  }

  /**
   * Send a message in a transfer negotiation
   * Only parties involved in the transfer can send messages
   */
  async sendMessage(
    transferRequestId: string,
    content: string,
    senderId: string
  ) {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: {
        acceptances: true,
        requester: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_NOT_FOUND);
    }

    // Only allow messaging if request is VERIFIED or MATCHED
    if (
      ![TransferRequestStatus.VERIFIED, TransferRequestStatus.MATCHED].includes(
        request.status as TransferRequestStatus
      )
    ) {
      throw AppException.badRequest(
        ErrorCode.TRANSFER_NOT_AVAILABLE,
        "Messaging is only available for verified or matched transfer requests"
      );
    }

    // Check if sender is authorized
    const isRequester = request.requesterId === senderId;
    const isMatchedParty = request.acceptances.some(
      (a) => a.acceptorId === senderId
    );

    if (!isRequester && !isMatchedParty) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_DENIED,
        "You are not authorized to send messages in this transfer"
      );
    }

    const message = await this.prisma.transferMessage.create({
      data: {
        transferRequestId,
        senderId,
        content,
        read: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Notify the recipient(s) about the new message
    try {
      // Determine who to notify (anyone except the sender)
      const recipientIds: string[] = [];
      if (request.requesterId !== senderId) {
        recipientIds.push(request.requesterId);
      }
      request.acceptances.forEach((a) => {
        if (a.acceptorId !== senderId && !recipientIds.includes(a.acceptorId)) {
          recipientIds.push(a.acceptorId);
        }
      });

      for (const recipientId of recipientIds) {
        await this.notificationsService.createNotification({
          userId: recipientId,
          type: "SYSTEM",
          title: "New Transfer Message",
          message: `${message.sender.firstName} ${message.sender.lastName} sent you a message regarding transfer request ${request.uniqueId}.`,
          metadata: {
            transferRequestId: request.id,
            uniqueId: request.uniqueId,
            messageId: message.id,
            action: "transfer_message_received",
            actionUrl: `/teacher/transfers`,
          },
          sendRealtime: true,
        });
      }
    } catch (error) {
      this.logger.error("Failed to send message notification", error);
    }

    return {
      id: message.id,
      transferRequestId: message.transferRequestId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      read: message.read,
      createdAt: message.createdAt,
    };
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(messageId: string, userId: string) {
    const message = await this.prisma.transferMessage.findUnique({
      where: { id: messageId },
      include: {
        request: {
          include: {
            acceptances: true,
          },
        },
      },
    });

    if (!message) {
      throw AppException.notFound(ErrorCode.MESSAGE_NOT_FOUND);
    }

    // Check if user is authorized to mark as read
    const request = message.request;
    const isRequester = request.requesterId === userId;
    const isMatchedParty = request.acceptances.some(
      (a: { acceptorId: string }) => a.acceptorId === userId
    );

    if (!isRequester && !isMatchedParty) {
      throw AppException.forbidden(ErrorCode.ACCESS_DENIED);
    }

    // Only the recipient (not the sender) should mark as read
    if (message.senderId === userId) {
      return { success: true }; // Sender's own message, no need to mark
    }

    await this.prisma.transferMessage.update({
      where: { id: messageId },
      data: { read: true },
    });

    return { success: true };
  }

  /**
   * Get unread message count for a user's transfer requests
   */
  async getUnreadMessageCount(userId: string): Promise<number> {
    // Get all transfer requests where user is involved
    const requests = await this.prisma.transferRequest.findMany({
      where: {
        OR: [
          { requesterId: userId },
          { acceptances: { some: { acceptorId: userId } } },
        ],
      },
      select: { id: true },
    });

    const requestIds = requests.map((r) => r.id);

    // Count unread messages not sent by the user
    const unreadCount = await this.prisma.transferMessage.count({
      where: {
        transferRequestId: { in: requestIds },
        senderId: { not: userId },
        read: false,
      },
    });

    return unreadCount;
  }
}
