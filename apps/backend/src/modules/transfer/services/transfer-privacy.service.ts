import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TransferRequestStatus } from '../dto/transfer.dto';

/**
 * Service responsible for implementing 3-stage information disclosure
 * based on FR-023.1 privacy requirements
 */
@Injectable()
export class TransferPrivacyService {
  /**
   * Determine the privacy stage based on viewer's relationship to the transfer request
   *
   * Stage 1: Public Listing (no relationship)
   * - Shows: Districts, Zones, Subjects, Grades, Experience years
   * - Hides: Teacher name, school name, contact details
   *
   * Stage 2: Interest Sent (viewer sent interest, not yet accepted)
   * - Sender sees: Full receiver profile (request owner)
   * - Receiver sees: Sender's district only (limited info)
   *
   * Stage 3: Interest Accepted (mutual acceptance)
   * - Both see: Full profiles + chat unlocked
   */
  determinePrivacyStage(
    viewerId: string | undefined,
    viewerRole: UserRole | undefined,
    requesterId: string,
    acceptances: Array<{ acceptorId: string; status: string }>
  ): "public" | "interest_sent" | "interest_accepted" | "admin" {
    // Admins always see everything
    if (viewerRole === UserRole.ADMIN) {
      return "admin";
    }

    // No viewer = public listing
    if (!viewerId) {
      return "public";
    }

    // Request owner always sees full details
    if (viewerId === requesterId) {
      return "admin"; // Requester has full access to their own request
    }

    // Check if viewer has sent interest
    const viewerAcceptance = acceptances.find(
      (acc) => acc.acceptorId === viewerId
    );

    if (viewerAcceptance) {
      // Interest accepted = Stage 3
      if (viewerAcceptance.status === "APPROVED") {
        return "interest_accepted";
      }
      // Interest sent but not accepted = Stage 2
      return "interest_sent";
    }

    // No relationship = public listing (Stage 1)
    return "public";
  }

  /**
   * Filter transfer request data based on privacy stage
   */
  filterTransferData(
    request: any,
    privacyStage: "public" | "interest_sent" | "interest_accepted" | "admin"
  ): any {
    const baseData = {
      id: request.id,
      uniqueId: request.uniqueId,
      fromZone: request.fromZone,
      toZones: request.desiredZones,
      subject: request.subject,
      medium: request.medium,
      level: request.level,
      yearsOfService: request.yearsOfService,
      verified: request.verified,
      status: request.status,
      createdAt: request.createdAt,
    };

    switch (privacyStage) {
      case "public":
        // Stage 1: Public Listing - Limited Info
        return {
          ...baseData,
          requester: null,
          currentSchool: null,
          currentDistrict: null,
          contactDetails: null,
          notes: null,
          qualifications: request.qualifications || [],
          acceptances: [], // Hide acceptance count
        };

      case "interest_sent":
        // Stage 2: Viewer sent interest - See receiver's full profile
        return {
          ...baseData,
          requester: {
            id: request.requester.id,
            firstName: request.requester.firstName,
            lastName: request.requester.lastName,
            email: request.requester.email,
            phone: request.requester.phone,
          },
          currentSchool: request.currentSchool,
          currentDistrict: request.currentDistrict,
          notes: request.notes,
          qualifications: request.qualifications,
          acceptances: [], // Hide other acceptances
        };

      case "interest_accepted":
        // Stage 3: Mutual acceptance - Full visibility + chat
        return {
          ...baseData,
          requester: {
            id: request.requester.id,
            firstName: request.requester.firstName,
            lastName: request.requester.lastName,
            email: request.requester.email,
            phone: request.requester.phone,
            registrationId: request.requester.registrationId,
          },
          currentSchool: request.currentSchool,
          currentDistrict: request.currentDistrict,
          notes: request.notes,
          qualifications: request.qualifications,
          chatEnabled: true,
          acceptances: request.acceptances, // Show accepted interests
        };

      case "admin":
        // Admin or request owner - Full access
        return {
          ...baseData,
          requester: request.requester,
          currentSchool: request.currentSchool,
          currentDistrict: request.currentDistrict,
          currentSchoolType: request.currentSchoolType,
          notes: request.notes,
          qualifications: request.qualifications,
          additionalRequirements: request.additionalRequirements,
          preferredSchoolTypes: request.preferredSchoolTypes,
          registrationId: request.registrationId,
          isInternalTeacher: request.isInternalTeacher,
          verifiedAt: request.verifiedAt,
          verifiedById: request.verifiedById,
          completedAt: request.completedAt,
          acceptances: request.acceptances,
          messages: request.messages,
        };

      default:
        return baseData;
    }
  }

  /**
   * Check if chat is unlocked for two users
   * Chat is unlocked when:
   * - Interest is accepted (status = APPROVED)
   * - Or request status is ACCEPTED
   */
  isChatUnlocked(
    viewerId: string,
    requesterId: string,
    acceptances: Array<{ acceptorId: string; status: string }>,
    requestStatus: TransferRequestStatus
  ): boolean {
    // Request owner can chat with anyone who has APPROVED interest
    if (viewerId === requesterId) {
      return acceptances.some((acc) => acc.status === "APPROVED");
    }

    // Acceptor can chat if their interest is APPROVED
    const viewerAcceptance = acceptances.find(
      (acc) => acc.acceptorId === viewerId
    );
    return (
      viewerAcceptance?.status === "APPROVED" ||
      requestStatus === TransferRequestStatus.ACCEPTED
    );
  }

  /**
   * Determine if viewer can send interest to a transfer request
   */
  canSendInterest(
    viewerId: string | undefined,
    requesterId: string,
    requestStatus: TransferRequestStatus,
    requestVerified: boolean,
    acceptances: Array<{ acceptorId: string }>
  ): { allowed: boolean; reason?: string } {
    if (!viewerId) {
      return { allowed: false, reason: "Must be logged in" };
    }

    if (viewerId === requesterId) {
      return {
        allowed: false,
        reason: "Cannot send interest to your own request",
      };
    }

    if (!requestVerified) {
      return { allowed: false, reason: "Request not yet verified by admin" };
    }

    if (
      requestStatus === TransferRequestStatus.CANCELLED ||
      requestStatus === TransferRequestStatus.COMPLETED
    ) {
      return { allowed: false, reason: "Request is closed" };
    }

    const alreadySent = acceptances.some((acc) => acc.acceptorId === viewerId);
    if (alreadySent) {
      return { allowed: false, reason: "Interest already sent" };
    }

    return { allowed: true };
  }
}
