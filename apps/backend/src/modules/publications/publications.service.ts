import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { ConfigService } from "@nestjs/config";
import {
  CreatePublicationDto,
  UpdatePublicationDto,
  PublicationQueryDto,
  CreateReviewDto,
} from "./dto/publication.dto";
import { AdminGateway } from "../../infrastructure/websocket/admin.gateway";
import { StorageService } from "../../infrastructure/storage/storage.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class PublicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
    private readonly adminGateway: AdminGateway,
    private readonly storageService: StorageService
  ) {}

  /**
   * Create a new publication (Admin/Teacher only)
   */
  // async create(createPublicationDto: CreatePublicationDto, userId: string) {
  //   const publication = await this.prisma.publication.create({
  //     data: {
  //       ...createPublicationDto,
  //       createdById: userId,
  //       status: createPublicationDto.status || "DRAFT",
  //       views: 0,
  //       downloads: 0,
  //     },
  //   });

  //   // Emit real-time event
  //   this.adminGateway.server.emit('publicationCreated', {
  //     publicationId: publication.id,
  //     data: publication,
  //     timestamp: new Date().toISOString(),
  //   });

  //   return publication;
  // }

  async create(createPublicationDto: CreatePublicationDto, userId: string) {
    const { gradeId, subjectId, mediumId, ...publicationData } =
      createPublicationDto;

    // Prepare the nested relations
    const relations: any = {};

    if (gradeId) {
      relations.grades = {
        create: {
          gradeId: gradeId,
        },
      };
    }

    if (subjectId) {
      relations.subjects = {
        create: {
          subjectId: subjectId,
        },
      };
    }

    if (mediumId) {
      relations.mediums = {
        create: {
          mediumId: mediumId,
        },
      };
    }

    // Create publication with nested relations
    const publication = await this.prisma.publication.create({
      data: {
        ...publicationData,
        createdById: userId,
        status: publicationData.status || "DRAFT",
        views: 0,
        downloads: 0,
        ...relations,
      },
      include: {
        grades: true,
        subjects: true,
        mediums: true,
      },
    });

    // Emit real-time event
    this.adminGateway.server.emit("publicationCreated", {
      publicationId: publication.id,
      data: publication,
      timestamp: new Date().toISOString(),
    });

    return publication;
  }

  /**
   * Update publication
   */
  async update(id: string, updatePublicationDto: UpdatePublicationDto) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      throw AppException.notFound(
        ErrorCode.PUBLICATION_NOT_FOUND,
        "Publication not found"
      );
    }

    // If publishing, set publishedAt
    const updateData: any = { ...updatePublicationDto };
    if (
      updatePublicationDto.status === "PUBLISHED" &&
      !publication.publishedAt
    ) {
      updateData.publishedAt = new Date();
    }

    const updatedPublication = await this.prisma.publication.update({
      where: { id },
      data: updateData,
    });

    // Emit real-time event
    this.adminGateway.server.emit("publicationUpdated", {
      publicationId: id,
      data: updatedPublication,
      timestamp: new Date().toISOString(),
    });

    return updatedPublication;
  }

  /**
   * Get all publications with filtering and pagination
   */
  async findAll(query: PublicationQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      grade,
      subject,
      medium,
      status,
      minPrice,
      maxPrice,
      sortBy = "newest",
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filter by status if explicitly provided (not undefined or empty)
    if (status && status !== "" && status !== "all") {
      where.status = status;
    }

    // Search in title, description, author
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { author: { contains: search, mode: "insensitive" } },
      ];
    }

    // Filter by grade
    if (grade) {
      where.grades = {
        some: {
          gradeId: grade,
        },
      };
    }

    // Filter by subject
    if (subject) {
      where.subjects = {
        some: {
          subjectId: subject,
        },
      };
    }

    // Filter by medium
    if (medium) {
      where.mediums = {
        some: {
          mediumId: medium,
        },
      };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) {where.price.gte = minPrice;}
      if (maxPrice !== undefined) {where.price.lte = maxPrice;}
    }

    // Determine sort order
    let orderBy: any = {};
    switch (sortBy) {
      case "oldest":
        orderBy = { createdAt: "asc" };
        break;
      case "price-asc":
        orderBy = { price: "asc" };
        break;
      case "price-desc":
        orderBy = { price: "desc" };
        break;
      case "popular":
        orderBy = { downloads: "desc" };
        break;
      case "newest":
      default:
        orderBy = { createdAt: "desc" };
        break;
    }

    const [publications, total] = await Promise.all([
      this.prisma.publication.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              purchases: true,
              reviews: true,
            },
          },
        },
      }),
      this.prisma.publication.count({ where }),
    ]);

    console.log(publications);

    // RETURN THE CORRECT STRUCTURE
    return {
      data: publications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get publication by ID
   */
  async findOne(id: string, userId?: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
      include: {
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        _count: {
          select: {
            purchases: true,
            reviews: true,
          },
        },
      },
    });

    if (!publication) {
      throw AppException.notFound(
        ErrorCode.PUBLICATION_NOT_FOUND,
        "Publication not found"
      );
    }

    // Increment view count
    await this.prisma.publication.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    // Check if user has purchased
    let hasPurchased = false;
    if (userId) {
      const purchase = await this.prisma.publicationPurchase.findUnique({
        where: {
          publicationId_userId: {
            publicationId: id,
            userId,
          },
        },
      });
      hasPurchased = !!purchase;
    }

    return { ...publication, hasPurchased };
  }

  /**
   * Purchase publication with wallet credits
   */
  async purchase(publicationId: string, userId: string) {
    const publication = await this.prisma.publication.findUnique({
      where: { id: publicationId },
    });

    if (!publication) {
      throw AppException.notFound(
        ErrorCode.PUBLICATION_NOT_FOUND,
        "Publication not found"
      );
    }

    if (publication.status !== "PUBLISHED") {
      throw AppException.badRequest(
        ErrorCode.PUBLICATION_NOT_AVAILABLE,
        "Publication is not available for purchase"
      );
    }

    // Check if already purchased
    const existingPurchase = await this.prisma.publicationPurchase.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
    });

    if (existingPurchase) {
      throw AppException.conflict(
        ErrorCode.PUBLICATION_ALREADY_PURCHASED,
        "Publication already purchased"
      );
    }

    // Calculate final price (use discount price if available)
    const finalPrice = publication.discountPrice || publication.price;

    // Check wallet balance
    const hasSufficient = await this.walletService.hasSufficientBalance(
      userId,
      finalPrice
    );

    if (!hasSufficient) {
      throw AppException.badRequest(
        ErrorCode.INSUFFICIENT_WALLET_BALANCE,
        "Insufficient wallet balance"
      );
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Debit wallet
      await this.walletService.debit(
        userId,
        finalPrice,
        `Purchase: ${publication.title}`,
        publicationId,
        "PUBLICATION"
      );

      // Create purchase record
      const purchase = await tx.publicationPurchase.create({
        data: {
          publicationId,
          userId,
          amount: finalPrice,
        },
        include: {
          publication: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create payment record
      await tx.payment.create({
        data: {
          userId,
          amount: finalPrice,
          method: "WALLET_CREDITS",
          status: "COMPLETED",
          description: `Publication purchase: ${publication.title}`,
          referenceType: "PUBLICATION",
          referenceId: publicationId,
          processedAt: new Date(),
        },
      });

      return purchase;
    });
  }

  /**
   * Get download URL for purchased publication (with signed URL)
   */
  async getDownloadUrl(publicationId: string, userId: string) {
    // Verify purchase
    const purchase = await this.prisma.publicationPurchase.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
      include: {
        publication: true,
      },
    });

    if (!purchase) {
      throw AppException.forbidden(
        ErrorCode.PUBLICATION_NOT_PURCHASED,
        "Publication not purchased. Please purchase before downloading."
      );
    }

    // Check access expiry if set
    if (purchase.accessExpiry && purchase.accessExpiry < new Date()) {
      throw AppException.forbidden(
        ErrorCode.ACCESS_EXPIRED,
        "Access to this publication has expired"
      );
    }

    // Check download limit if set
    if (
      purchase.maxDownloads &&
      purchase.downloadCount >= purchase.maxDownloads
    ) {
      throw AppException.forbidden(
        ErrorCode.DOWNLOAD_LIMIT_REACHED,
        "Maximum download limit reached"
      );
    }

    // Update download count and last accessed
    await this.prisma.publicationPurchase.update({
      where: { id: purchase.id },
      data: {
        downloadCount: { increment: 1 },
        lastAccessedAt: new Date(),
      },
    });

    // Increment publication download count
    await this.prisma.publication.update({
      where: { id: publicationId },
      data: { downloads: { increment: 1 } },
    });

    // Generate signed URL for secure download
    const expiresIn = 3600; // 1 hour
    const signedUrl = await this.storageService.getSignedUrl(
      purchase.publication.fileUrl,
      expiresIn
    );

    return {
      url: signedUrl,
      expiresIn,
      downloadCount: purchase.downloadCount + 1,
      maxDownloads: purchase.maxDownloads,
    };
  }

  /**
   * Create review for publication
   */
  async createReview(
    publicationId: string,
    userId: string,
    createReviewDto: CreateReviewDto
  ) {
    // Verify purchase
    const purchase = await this.prisma.publicationPurchase.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
    });

    if (!purchase) {
      throw AppException.forbidden(
        ErrorCode.PUBLICATION_NOT_PURCHASED,
        "You must purchase the publication to review it"
      );
    }

    // Check if review already exists
    const existingReview = await this.prisma.publicationReview.findUnique({
      where: {
        publicationId_userId: {
          publicationId,
          userId,
        },
      },
    });

    if (existingReview) {
      // Update existing review
      return this.prisma.publicationReview.update({
        where: { id: existingReview.id },
        data: {
          rating: createReviewDto.rating,
          comment: createReviewDto.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });
    }

    // Create new review
    const review = await this.prisma.publicationReview.create({
      data: {
        publicationId,
        userId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update publication average rating
    await this.updatePublicationRating(publicationId);

    return review;
  }

  /**
   * Update publication average rating
   */
  private async updatePublicationRating(publicationId: string) {
    const result = await this.prisma.publicationReview.aggregate({
      where: { publicationId },
      _avg: {
        rating: true,
      },
    });

    if (result._avg.rating) {
      await this.prisma.publication.update({
        where: { id: publicationId },
        data: { rating: result._avg.rating },
      });
    }
  }

  /**
   * Get user's purchased publications
   */
  async getUserPurchases(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      this.prisma.publicationPurchase.findMany({
        where: { userId },
        orderBy: { purchasedAt: "desc" },
        skip,
        take: limit,
        include: {
          publication: true,
        },
      }),
      this.prisma.publicationPurchase.count({ where: { userId } }),
    ]);

    return {
      purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get users who purchased a specific publication (Admin only)
   */
  async getPublicationPurchasers(
    publicationId: string,
    page: number = 1,
    limit: number = 50
  ) {
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      this.prisma.publicationPurchase.findMany({
        where: { publicationId },
        orderBy: { purchasedAt: "desc" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
              role: true,
              status: true,
            },
          },
        },
      }),
      this.prisma.publicationPurchase.count({ where: { publicationId } }),
    ]);

    return {
      purchasers: purchases,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Delete publication - Admin/Teacher. Teachers can delete any publication. */
  async remove(id: string, user?: any) {
    const publication = await this.prisma.publication.findUnique({
      where: { id },
    });

    if (!publication) {
      throw AppException.notFound(
        ErrorCode.PUBLICATION_NOT_FOUND,
        "Publication not found"
      );
    }

    // Check ownership - only creator or admin can delete
    if (
      user &&
      publication.createdById &&
      publication.createdById !== user.id
    ) {
      // Check if user is admin
      const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
      if (!isAdmin) {
        throw AppException.forbidden(
          ErrorCode.FORBIDDEN,
          "Only the publication creator or admin can delete this publication"
        );
      }
    }

    // Check if publication has purchases
    const purchaseCount = await this.prisma.publicationPurchase.count({
      where: { publicationId: id },
    });

    if (purchaseCount > 0) {
      throw AppException.badRequest(
        ErrorCode.PUBLICATION_HAS_PURCHASES,
        "Cannot delete publication with existing purchases. Archive it instead."
      );
    }

    const deletedPublication = await this.prisma.publication.delete({
      where: { id },
    });

    // Emit real-time event
    this.adminGateway.server.emit("publicationDeleted", {
      publicationId: id,
      timestamp: new Date().toISOString(),
    });

    return deletedPublication;
  }
}
