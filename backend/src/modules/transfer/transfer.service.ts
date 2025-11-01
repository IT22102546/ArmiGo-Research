import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { RoleHelper } from "../../common/helpers/role.helper";
import {
  CreateTransferRequestDto,
  UpdateTransferRequestDto,
  QueryTransferRequestDto,
  AcceptTransferDto,
  RejectTransferDto,
  VerifyTransferDto,
  SendMessageDto,
  TransferRequestResponseDto,
  TransferMessageResponseDto,
  TransferMatchDto,
  TransferStatsDto,
  TransferRequestStatus,
} from "./dto/transfer.dto";
import { UserRole } from "@prisma/client";

@Injectable()
export class TransferService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new transfer request
   */
  async create(
    dto: CreateTransferRequestDto,
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
            TransferRequestStatus.ACCEPTED,
          ],
        },
      },
    });

    if (existingRequest) {
      throw new BadRequestException(
        "You already have an active transfer request"
      );
    }

    // Generate unique ID (e.g., TR-2025-00001)
    const year = new Date().getFullYear();
    const count = await this.prisma.transferRequest.count();
    const uniqueId = `TR-${year}-${String(count + 1).padStart(5, "0")}`;

    const request = await this.prisma.transferRequest.create({
      data: {
        uniqueId,
        requesterId: userId,
        registrationId: dto.registrationId,
        currentSchool: dto.currentSchool,
        currentDistrict: dto.currentDistrict,
        currentZone: dto.currentZone,
        fromZone: dto.fromZone,
        toZones: dto.toZones,
        subject: dto.subject,
        medium: dto.medium,
        level: dto.level,
        notes: dto.notes,
        attachments: dto.attachments || [],
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

    return this.mapToResponseDto(request);
  }

  /**
   * Get all transfer requests with filters
   */
  async findAll(
    query: QueryTransferRequestDto,
    userId: string,
    userRole: UserRole
  ): Promise<TransferRequestResponseDto[]> {
    const where: any = {};

    // Apply filters
    if (query.status) where.status = query.status;
    if (query.fromZone) where.fromZone = query.fromZone;
    if (query.toZone) where.toZones = { has: query.toZone };
    if (query.subject) where.subject = query.subject;
    if (query.medium) where.medium = query.medium;
    if (query.level) where.level = query.level;
    if (query.verified !== undefined) where.verified = query.verified;

    // Role-based filtering
    if (userRole !== UserRole.ADMIN) {
      // Teachers can only see verified requests or their own requests
      where.OR = [
        { requesterId: userId },
        { receiverId: userId },
        { verified: true, status: TransferRequestStatus.VERIFIED },
      ];
    }

    if (query.requesterId) where.requesterId = query.requesterId;
    if (query.receiverId) where.receiverId = query.receiverId;

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
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return requests.map((r) => this.mapToResponseDto(r, userId));
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
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
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
      throw new NotFoundException("Transfer request not found");
    }

    // Check permissions
    const isRequester = request.requesterId === userId;
    const isReceiver = request.receiverId === userId;
    const isAdmin = userRole === UserRole.ADMIN;

    if (!isRequester && !isReceiver && !isAdmin) {
      throw new ForbiddenException(
        "You do not have permission to view this request"
      );
    }

    return this.mapToResponseDto(request, userId);
  }

  /**
   * Update transfer request
   */
  async update(
    id: string,
    dto: UpdateTransferRequestDto,
    userId: string,
    userRole: UserRole
  ): Promise<TransferRequestResponseDto> {
    const existing = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Transfer request not found");
    }

    // Only requester or admin can update
    if (existing.requesterId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "You do not have permission to update this request"
      );
    }

    // Cannot update if already accepted or completed
    if (
      [
        TransferRequestStatus.ACCEPTED,
        TransferRequestStatus.COMPLETED,
      ].includes(existing.status as TransferRequestStatus)
    ) {
      throw new BadRequestException(
        "Cannot update accepted or completed requests"
      );
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id },
      data: {
        ...(dto.registrationId && { registrationId: dto.registrationId }),
        ...(dto.currentSchool && { currentSchool: dto.currentSchool }),
        ...(dto.currentDistrict && { currentDistrict: dto.currentDistrict }),
        ...(dto.currentZone && { currentZone: dto.currentZone }),
        ...(dto.fromZone && { fromZone: dto.fromZone }),
        ...(dto.toZones && { toZones: dto.toZones }),
        ...(dto.subject && { subject: dto.subject }),
        ...(dto.medium && { medium: dto.medium }),
        ...(dto.level && { level: dto.level }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
        ...(dto.attachments && { attachments: dto.attachments }),
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

    return this.mapToResponseDto(updated);
  }

  /**
   * Cancel transfer request
   */
  async cancel(id: string, userId: string, userRole: UserRole): Promise<void> {
    const existing = await this.prisma.transferRequest.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException("Transfer request not found");
    }

    // Only requester or admin can cancel
    if (existing.requesterId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException(
        "You do not have permission to cancel this request"
      );
    }

    // Cannot cancel if already completed
    if (existing.status === TransferRequestStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel completed requests");
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
    // Get user's transfer request
    const myRequest = await this.prisma.transferRequest.findFirst({
      where: {
        requesterId: userId,
        status: {
          in: [TransferRequestStatus.PENDING, TransferRequestStatus.VERIFIED],
        },
      },
    });

    if (!myRequest) {
      return [];
    }

    // Find potential matches
    // Match criteria: Their fromZone is in my toZones AND my fromZone is in their toZones
    // Same subject, medium, level
    const potentialMatches = await this.prisma.transferRequest.findMany({
      where: {
        id: { not: myRequest.id },
        status: TransferRequestStatus.VERIFIED,
        verified: true,
        subject: myRequest.subject,
        medium: myRequest.medium,
        level: myRequest.level,
        fromZone: { in: myRequest.toZones },
        toZones: { has: myRequest.fromZone },
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate match scores
    const matches: TransferMatchDto[] = potentialMatches.map((match) => {
      let score = 60; // Base score for meeting basic criteria

      // Exact zone match
      if (match.fromZone === myRequest.toZones[0]) score += 20;
      if (myRequest.fromZone === match.toZones[0]) score += 20;

      return {
        id: match.id,
        uniqueId: match.uniqueId,
        requester: {
          id: match.requester.id,
          firstName: match.requester.firstName,
          lastName: match.requester.lastName,
          registrationId: match.registrationId,
          currentZone: match.currentZone,
        },
        fromZone: match.fromZone,
        toZones: match.toZones,
        subject: match.subject,
        medium: match.medium,
        level: match.level,
        matchScore: score,
        verified: match.verified,
        createdAt: match.createdAt,
      };
    });

    // Sort by match score
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }

  /**
   * Accept a transfer match
   */
  async acceptTransfer(
    dto: AcceptTransferDto,
    userId: string
  ): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: dto.transferRequestId },
      include: {
        requester: true,
      },
    });

    if (!request) {
      throw new NotFoundException("Transfer request not found");
    }

    if (!request.verified) {
      throw new BadRequestException("Cannot accept unverified requests");
    }

    if (request.status !== TransferRequestStatus.VERIFIED) {
      throw new BadRequestException("Request is not available for acceptance");
    }

    // Check if my request matches with theirs
    const myRequest = await this.prisma.transferRequest.findFirst({
      where: {
        requesterId: userId,
        status: TransferRequestStatus.VERIFIED,
      },
    });

    if (!myRequest) {
      throw new BadRequestException(
        "You must have a verified transfer request to accept matches"
      );
    }

    // Verify compatibility
    const compatible =
      myRequest.subject === request.subject &&
      myRequest.medium === request.medium &&
      myRequest.level === request.level &&
      myRequest.toZones.includes(request.fromZone) &&
      request.toZones.includes(myRequest.fromZone);

    if (!compatible) {
      throw new BadRequestException("Transfer requests are not compatible");
    }

    // Update both requests
    await this.prisma.$transaction([
      // Update the accepted request
      this.prisma.transferRequest.update({
        where: { id: request.id },
        data: {
          status: TransferRequestStatus.ACCEPTED,
          receiverId: userId,
          receiverVisible: true,
          requesterVisible: true,
        },
      }),
      // Update my request
      this.prisma.transferRequest.update({
        where: { id: myRequest.id },
        data: {
          status: TransferRequestStatus.ACCEPTED,
          receiverId: request.requesterId,
          receiverVisible: true,
          requesterVisible: true,
        },
      }),
    ]);

    // Return the updated request - user must be a teacher
    return this.findOne(request.id, userId, RoleHelper.getAllTeacherRoles()[0]);
  }

  /**
   * Reject a transfer match
   */
  async rejectTransfer(dto: RejectTransferDto, userId: string): Promise<void> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: dto.transferRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transfer request not found");
    }

    // Can only reject if you're involved
    if (request.requesterId !== userId && request.receiverId !== userId) {
      throw new ForbiddenException("You are not part of this transfer");
    }

    // If already accepted, both parties go back to VERIFIED
    if (request.status === TransferRequestStatus.ACCEPTED) {
      // Find the other request
      const otherRequest = await this.prisma.transferRequest.findFirst({
        where: {
          OR: [
            {
              requesterId: request.receiverId,
              receiverId: request.requesterId,
            },
            {
              receiverId: request.receiverId,
              requesterId: request.requesterId,
            },
          ],
        },
      });

      await this.prisma.$transaction([
        this.prisma.transferRequest.update({
          where: { id: request.id },
          data: {
            status: TransferRequestStatus.VERIFIED,
            receiverId: null,
            receiverVisible: false,
            requesterVisible: false,
          },
        }),
        ...(otherRequest
          ? [
              this.prisma.transferRequest.update({
                where: { id: otherRequest.id },
                data: {
                  status: TransferRequestStatus.VERIFIED,
                  receiverId: null,
                  receiverVisible: false,
                  requesterVisible: false,
                },
              }),
            ]
          : []),
      ]);
    }
  }

  /**
   * Verify transfer request (Admin only)
   */
  async verify(
    dto: VerifyTransferDto,
    adminId: string
  ): Promise<TransferRequestResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: dto.transferRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transfer request not found");
    }

    const updated = await this.prisma.transferRequest.update({
      where: { id: dto.transferRequestId },
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
      throw new NotFoundException("Transfer request not found");
    }

    if (request.status !== TransferRequestStatus.ACCEPTED) {
      throw new BadRequestException("Can only complete accepted transfers");
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
        receiver: {
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

    return this.mapToResponseDto(updated);
  }

  /**
   * Send message in transfer request
   */
  async sendMessage(
    dto: SendMessageDto,
    userId: string
  ): Promise<TransferMessageResponseDto> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: dto.transferRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transfer request not found");
    }

    // Only requester and receiver can message
    if (request.requesterId !== userId && request.receiverId !== userId) {
      throw new ForbiddenException("You are not part of this transfer");
    }

    const message = await this.prisma.transferMessage.create({
      data: {
        transferRequestId: dto.transferRequestId,
        senderId: userId,
        content: dto.content,
      },
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
    });

    return this.mapMessageToResponseDto(message);
  }

  /**
   * Get messages for a transfer request
   */
  async getMessages(
    transferRequestId: string,
    userId: string,
    userRole: UserRole
  ): Promise<TransferMessageResponseDto[]> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
    });

    if (!request) {
      throw new NotFoundException("Transfer request not found");
    }

    // Check permissions
    if (
      request.requesterId !== userId &&
      request.receiverId !== userId &&
      userRole !== UserRole.ADMIN
    ) {
      throw new ForbiddenException(
        "You do not have permission to view messages"
      );
    }

    const messages = await this.prisma.transferMessage.findMany({
      where: { transferRequestId },
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
    });

    return messages.map((m) => this.mapMessageToResponseDto(m));
  }

  /**
   * Mark message as read
   */
  async markMessageRead(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.transferMessage.findUnique({
      where: { id: messageId },
      include: { request: true },
    });

    if (!message) {
      throw new NotFoundException("Message not found");
    }

    // Can only mark as read if you're the receiver
    if (message.senderId === userId) {
      throw new BadRequestException("Cannot mark your own message as read");
    }

    const request = message.request;
    if (request.requesterId !== userId && request.receiverId !== userId) {
      throw new ForbiddenException("You are not part of this conversation");
    }

    await this.prisma.transferMessage.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Get transfer statistics (Admin only)
   */
  async getStats(): Promise<TransferStatsDto> {
    const [
      total,
      pending,
      verified,
      accepted,
      completed,
      rejected,
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
        where: { status: TransferRequestStatus.ACCEPTED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.COMPLETED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.REJECTED },
      }),
      this.prisma.transferRequest.count({
        where: { status: TransferRequestStatus.CANCELLED },
      }),
      this.prisma.transferRequest.findMany({
        select: {
          createdAt: true,
          completedAt: true,
          fromZone: true,
          subject: true,
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

    // Group by zone
    const zoneMap: Record<string, { requests: number; completed: number }> = {};
    allRequests.forEach((r) => {
      if (!zoneMap[r.fromZone]) {
        zoneMap[r.fromZone] = { requests: 0, completed: 0 };
      }
      zoneMap[r.fromZone].requests++;
      if (r.status === TransferRequestStatus.COMPLETED) {
        zoneMap[r.fromZone].completed++;
      }
    });

    // Group by subject
    const subjectMap: Record<string, { requests: number; completed: number }> =
      {};
    allRequests.forEach((r) => {
      if (!subjectMap[r.subject]) {
        subjectMap[r.subject] = { requests: 0, completed: 0 };
      }
      subjectMap[r.subject].requests++;
      if (r.status === TransferRequestStatus.COMPLETED) {
        subjectMap[r.subject].completed++;
      }
    });

    return {
      totalRequests: total,
      pendingRequests: pending,
      verifiedRequests: verified,
      acceptedRequests: accepted,
      completedRequests: completed,
      rejectedRequests: rejected,
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
    request: any,
    viewerId?: string
  ): TransferRequestResponseDto {
    // Progressive disclosure: hide full details based on visibility flags
    const isRequester = viewerId && request.requesterId === viewerId;
    const isReceiver = viewerId && request.receiverId === viewerId;

    return {
      id: request.id,
      uniqueId: request.uniqueId,
      requesterId: request.requesterId,
      requester:
        isRequester || request.requesterVisible || !viewerId
          ? request.requester
          : {
              id: request.requester.id,
              firstName: request.requester.firstName.substring(0, 1) + "***",
              lastName: request.requester.lastName.substring(0, 1) + "***",
              email: "***@***.***",
            },
      registrationId: request.registrationId,
      currentSchool: request.currentSchool,
      currentDistrict: request.currentDistrict,
      currentZone: request.currentZone,
      fromZone: request.fromZone,
      toZones: request.toZones,
      subject: request.subject,
      medium: request.medium,
      level: request.level,
      receiverId: request.receiverId,
      receiver: request.receiver
        ? isReceiver || request.receiverVisible || !viewerId
          ? request.receiver
          : {
              id: request.receiver.id,
              firstName: request.receiver.firstName.substring(0, 1) + "***",
              lastName: request.receiver.lastName.substring(0, 1) + "***",
              email: "***@***.***",
            }
        : undefined,
      status: request.status,
      verified: request.verified,
      verifiedBy: request.verifiedBy,
      verifiedAt: request.verifiedAt,
      verificationNotes: request.verificationNotes,
      requesterVisible: request.requesterVisible,
      receiverVisible: request.receiverVisible,
      notes: request.notes,
      attachments: request.attachments,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      completedAt: request.completedAt,
      messages: request.messages?.map((m: any) =>
        this.mapMessageToResponseDto(m)
      ),
    };
  }

  /**
   * Map message to response DTO
   */
  private mapMessageToResponseDto(message: any): TransferMessageResponseDto {
    return {
      id: message.id,
      transferRequestId: message.transferRequestId,
      senderId: message.senderId,
      sender: message.sender,
      content: message.content,
      read: message.read,
      readAt: message.readAt,
      createdAt: message.createdAt,
    };
  }
}
