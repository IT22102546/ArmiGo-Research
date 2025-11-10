import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@database/prisma.service';
import { AppException } from '../../../common/errors/app-exception';
import { ErrorCode } from '../../../common/errors/error-codes.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { TransferPrivacyService } from './transfer-privacy.service';
import { SendInterestDto, RespondToInterestDto, PauseTransferDto, UpdateTransferRequestDto } from '../dto/send-interest.dto';
import { TransferRequestStatus } from '../dto/transfer.dto';
import { UserRole } from '@prisma/client';

/**
 * Service for managing transfer request interests and advanced operations
 * Implements FR-023.2: Interest-Based Matching System
 */
@Injectable()
export class TransferInterestService {
  private readonly logger = new Logger(TransferInterestService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private privacyService: TransferPrivacyService,
  ) {}

  /**
   * Send interest to a transfer request
   * FR-023.2.1: Teacher B sends interest to Teacher A's request
   */
  async sendInterest(
    transferRequestId: string,
    dto: SendInterestDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Fetch the transfer request with acceptances
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: {
        acceptances: true,
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

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_REQUEST_NOT_FOUND);
    }

    // Validate if user can send interest
    const canSend = this.privacyService.canSendInterest(
      userId,
      request.requesterId,
      request.status as TransferRequestStatus,
      request.verified,
      request.acceptances,
    );

    if (!canSend.allowed) {
      throw AppException.badRequest(ErrorCode.INVALID_REQUEST, canSend.reason);
    }

    // Get sender's details to show in notification
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        city: true,
      },
    });

    // Create acceptance record with PENDING status
    const acceptance = await this.prisma.transferAcceptance.create({
      data: {
        transferRequestId,
        acceptorId: userId,
        status: 'PENDING',
        notes: dto.message || null,
      },
    });

    // Update request status to MATCHED (if not already)
    if (request.status === TransferRequestStatus.VERIFIED) {
      await this.prisma.transferRequest.update({
        where: { id: transferRequestId },
        data: { status: TransferRequestStatus.MATCHED },
      });
    }

    // Create notification for request owner
    await this.notificationsService.createNotification({
      userId: request.requesterId,
      type: 'SYSTEM',
      title: 'New Interest Received! 🔔',
      message: `${sender?.firstName || 'A teacher'} from ${sender?.city || 'another area'} is interested in your transfer request ${request.uniqueId}.`,
      metadata: {
        transferRequestId,
        acceptanceId: acceptance.id,
        action: 'review_interest',
      },
    });

    this.logger.log(
      `Interest sent: User ${userId} → Request ${request.uniqueId} (ID: ${transferRequestId})`,
    );

    return {
      success: true,
      message: 'Interest sent successfully. The request owner will review it.',
    };
  }

  /**
   * Accept an interest (approve the acceptance)
   * FR-023.2.2: Teacher A accepts Teacher B's interest
   */
  async acceptInterest(
    acceptanceId: string,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const acceptance = await this.prisma.transferAcceptance.findUnique({
      where: { id: acceptanceId },
      include: {
        request: {
          include: {
            requester: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        acceptor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!acceptance) {
      throw AppException.notFound(ErrorCode.ACCEPTANCE_NOT_FOUND);
    }

    // Only request owner can accept interests
    if (acceptance.request.requesterId !== userId) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Only the request owner can accept interests',
      );
    }

    // Cannot accept if already approved or rejected
    if (acceptance.status === 'APPROVED') {
      throw AppException.badRequest(
        ErrorCode.INVALID_REQUEST,
        'Interest already accepted',
      );
    }

    if (acceptance.status === 'REJECTED') {
      throw AppException.badRequest(
        ErrorCode.INVALID_REQUEST,
        'Interest was previously rejected',
      );
    }

    // Update acceptance status to APPROVED
    await this.prisma.transferAcceptance.update({
      where: { id: acceptanceId },
      data: {
        status: 'APPROVED',
        acceptedAt: new Date(),
      },
    });

    // Update request status to ACCEPTED
    await this.prisma.transferRequest.update({
      where: { id: acceptance.transferRequestId },
      data: { status: TransferRequestStatus.ACCEPTED },
    });

    // Notify the acceptor (interest sender)
    await this.notificationsService.createNotification({
      userId: acceptance.acceptorId,
      type: 'SYSTEM',
      title: 'Your Interest Was Accepted! 🎉',
      message: `${acceptance.request.requester.firstName} ${acceptance.request.requester.lastName} accepted your interest. You can now chat to coordinate the transfer!`,
      metadata: {
        transferRequestId: acceptance.transferRequestId,
        acceptanceId,
        action: 'open_chat',
      },
    });

    this.logger.log(
      `Interest accepted: Request ${acceptance.request.uniqueId} → Acceptor ${acceptance.acceptor.firstName}`,
    );

    return {
      success: true,
      message: 'Interest accepted. Chat is now unlocked!',
    };
  }

  /**
   * Reject an interest
   * FR-023.2.3: Teacher A rejects Teacher B's interest
   */
  async rejectInterest(
    acceptanceId: string,
    userId: string,
    message?: string,
  ): Promise<{ success: boolean; message: string }> {
    const acceptance = await this.prisma.transferAcceptance.findUnique({
      where: { id: acceptanceId },
      include: {
        request: {
          include: {
            requester: true,
          },
        },
        acceptor: {
          select: {
            id: true,
            firstName: true,
          },
        },
      },
    });

    if (!acceptance) {
      throw AppException.notFound(ErrorCode.ACCEPTANCE_NOT_FOUND);
    }

    // Only request owner can reject interests
    if (acceptance.request.requesterId !== userId) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Only the request owner can reject interests',
      );
    }

    // Update acceptance status to REJECTED
    await this.prisma.transferAcceptance.update({
      where: { id: acceptanceId },
      data: {
        status: 'REJECTED',
        notes: message || null,
      },
    });

    // Notify the acceptor
    await this.notificationsService.createNotification({
      userId: acceptance.acceptorId,
      type: 'SYSTEM',
      title: 'Interest Not Matched',
      message: `Your interest in transfer request ${acceptance.request.uniqueId} was not selected. Keep searching for other matches!`,
      metadata: {
        transferRequestId: acceptance.transferRequestId,
        acceptanceId,
      },
    });

    this.logger.log(
      `Interest rejected: Request ${acceptance.request.uniqueId} → Acceptor ${acceptance.acceptor.firstName}`,
    );

    return {
      success: true,
      message: 'Interest rejected.',
    };
  }

  /**
   * Get all interests received for a transfer request
   * FR-023.2.4: Request owner views all interests
   */
  async getReceivedInterests(
    transferRequestId: string,
    userId: string,
  ): Promise<any[]> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_REQUEST_NOT_FOUND);
    }

    // Only request owner can view received interests
    if (request.requesterId !== userId) {
      throw AppException.forbidden(
        ErrorCode.FORBIDDEN,
        'Only the request owner can view received interests',
      );
    }

    const acceptances = await this.prisma.transferAcceptance.findMany({
      where: { transferRequestId },
      include: {
        acceptor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            city: true,
            district: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return acceptances.map(acc => ({
      id: acc.id,
      status: acc.status,
      message: acc.notes,
      createdAt: acc.createdAt,
      acceptedAt: acc.acceptedAt,
      acceptor: {
        id: acc.acceptor.id,
        name: `${acc.acceptor.firstName} ${acc.acceptor.lastName}`,
        email: acc.acceptor.email,
        phone: acc.acceptor.phone,
        city: acc.acceptor.city,
        district: acc.acceptor.district?.name,
      },
    }));
  }

  /**
   * Get all interests sent by a user
   * FR-023.2.5: Teacher views their sent interests
   */
  async getSentInterests(userId: string): Promise<any[]> {
    const acceptances = await this.prisma.transferAcceptance.findMany({
      where: { acceptorId: userId },
      include: {
        request: {
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
            fromZone: true,
            desiredZones: {
              include: {
                zone: true,
              },
            },
            subject: true,
            medium: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return acceptances.map(acc => ({
      id: acc.id,
      status: acc.status,
      message: acc.notes,
      createdAt: acc.createdAt,
      acceptedAt: acc.acceptedAt,
      request: {
        id: acc.request.id,
        uniqueId: acc.request.uniqueId,
        status: acc.request.status,
        fromZone: acc.request.fromZone?.name,
        toZones: acc.request.desiredZones.map(dz => dz.zone.name),
        subject: acc.request.subject?.name,
        medium: acc.request.medium?.name,
        level: acc.request.level,
        requester: {
          id: acc.request.requester.id,
          name: `${acc.request.requester.firstName} ${acc.request.requester.lastName}`,
          email: acc.status === 'APPROVED' ? acc.request.requester.email : null,
          phone: acc.status === 'APPROVED' ? acc.request.requester.phone : null,
        },
      },
    }));
  }

  /**
   * Pause a transfer request
   * FR-024.1: Teacher pauses their request temporarily
   */
  async pauseRequest(
    transferRequestId: string,
    userId: string,
    dto?: PauseTransferDto,
  ): Promise<{ success: boolean; message: string }> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_REQUEST_NOT_FOUND);
    }

    // Only request owner can pause
    if (request.requesterId !== userId) {
      throw AppException.forbidden(ErrorCode.FORBIDDEN);
    }

    // Can only pause VERIFIED or MATCHED requests
    if (
      request.status !== TransferRequestStatus.VERIFIED &&
      request.status !== TransferRequestStatus.MATCHED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_REQUEST,
        'Only verified or matched requests can be paused',
      );
    }

    // Update status to PAUSED (need to add this to enum)
    await this.prisma.transferRequest.update({
      where: { id: transferRequestId },
      data: {
        // Store current status in notes for restoration
        notes: dto?.reason
          ? `${request.notes || ''}\n[PAUSED: ${dto.reason}]`
          : request.notes,
        // For now, we'll use CANCELLED status with a flag in notes
        // TODO: Add PAUSED status to TransferRequestStatus enum
        status: TransferRequestStatus.CANCELLED,
      },
    });

    this.logger.log(`Request paused: ${request.uniqueId} by user ${userId}`);

    return {
      success: true,
      message: 'Request paused successfully. It will not appear in search results.',
    };
  }

  /**
   * Edit a transfer request
   * FR-024.2: Teacher edits their request (only if no interests received)
   */
  async editRequest(
    transferRequestId: string,
    dto: UpdateTransferRequestDto,
    userId: string,
  ): Promise<{ success: boolean; message: string }> {
    const request = await this.prisma.transferRequest.findUnique({
      where: { id: transferRequestId },
      include: {
        acceptances: true,
      },
    });

    if (!request) {
      throw AppException.notFound(ErrorCode.TRANSFER_REQUEST_NOT_FOUND);
    }

    // Only request owner can edit
    if (request.requesterId !== userId) {
      throw AppException.forbidden(ErrorCode.FORBIDDEN);
    }

    // Cannot edit if interests already received
    if (request.acceptances.length > 0) {
      throw AppException.badRequest(
        ErrorCode.INVALID_REQUEST,
        'Cannot edit request after receiving interests. Please cancel and create a new one.',
      );
    }

    // Can only edit PENDING or VERIFIED requests
    if (
      request.status !== TransferRequestStatus.PENDING &&
      request.status !== TransferRequestStatus.VERIFIED
    ) {
      throw AppException.badRequest(
        ErrorCode.INVALID_REQUEST,
        'Can only edit pending or verified requests',
      );
    }

    // Update allowed fields
    const updateData: any = {};

    if (dto.notes !== undefined) {
      updateData.notes = dto.notes;
    }

    if (dto.additionalRequirements !== undefined) {
      updateData.additionalRequirements = dto.additionalRequirements;
    }

    if (dto.preferredSchoolTypes !== undefined) {
      updateData.preferredSchoolTypes = dto.preferredSchoolTypes;
    }

    // Update desired zones if provided
    if (dto.toZones && dto.toZones.length > 0) {
      // Delete existing desired zones
      await this.prisma.transferRequestDesiredZone.deleteMany({
        where: { transferRequestId },
      });

      // Create new desired zones
      const zones = await this.prisma.zone.findMany({
        where: {
          OR: dto.toZones.map(zoneName => ({
            OR: [
              { name: { equals: zoneName, mode: 'insensitive' } },
              { code: { equals: zoneName, mode: 'insensitive' } },
            ],
          })),
        },
      });

      await this.prisma.transferRequestDesiredZone.createMany({
        data: zones.map((zone, idx) => ({
          transferRequestId,
          zoneId: zone.id,
          priority: idx + 1,
        })),
      });
    }

    await this.prisma.transferRequest.update({
      where: { id: transferRequestId },
      data: updateData,
    });

    this.logger.log(`Request edited: ${request.uniqueId} by user ${userId}`);

    return {
      success: true,
      message: 'Request updated successfully.',
    };
  }
}
