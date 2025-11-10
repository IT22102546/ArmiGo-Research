import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { MetricsService } from "./metrics.service";

export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId?: string;
  data?: any;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private metricsService: MetricsService
  ) {}

  async trackEvent(event: AnalyticsEvent) {
    try {
      // Store the event in the database
      await this.prisma.analyticsEvent.create({
        data: {
          event: event.eventType,
          userId: event.userId || null,
          sessionId: event.sessionId || null,
          properties: event.data || event.metadata || null,
          ipAddress: event.ipAddress || null,
          userAgent: event.userAgent || null,
        },
      });

      // Update metrics - using available method names
      if (event.eventType === "publication_view") {
        this.metricsService.incrementPublicationViews("general", "all", "all");
      }

      if (event.userId) {
        this.metricsService.setActiveUsers("general", 1);
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  async getMarketplaceAnalytics(startDate: Date, endDate: Date) {
    try {
      // Get total revenue and purchases
      const purchases = await this.prisma.publicationPurchase.findMany({
        where: {
          purchasedAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          publication: {
            select: {
              id: true,
              title: true,
              price: true,
              discountPrice: true,
              grades: {
                include: {
                  grade: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
              subjects: {
                include: {
                  subject: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const totalRevenue = purchases.reduce((sum, purchase) => {
        return sum + purchase.amount;
      }, 0);

      const totalPurchases = purchases.length;

      // Get top publications by purchases
      const publicationPurchases = purchases.reduce<
        Record<
          string,
          { publication: any; purchaseCount: number; revenue: number }
        >
      >((acc, purchase) => {
        const pubId = purchase.publication.id;
        if (!acc[pubId]) {
          acc[pubId] = {
            publication: purchase.publication,
            purchaseCount: 0,
            revenue: 0,
          };
        }
        acc[pubId].purchaseCount++;
        acc[pubId].revenue += purchase.amount;
        return acc;
      }, {});

      const topPublications = Object.values(publicationPurchases)
        .sort((a: any, b: any) => b.purchaseCount - a.purchaseCount)
        .slice(0, 10);

      // Update metrics using available methods
      this.metricsService.incrementMarketplaceRevenue(totalRevenue, "general");
      // Track purchases as publication downloads for metrics
      topPublications.forEach((pub: any) => {
        this.metricsService.incrementPublicationDownloads(
          "general",
          "all",
          "all"
        );
      });

      return {
        totalRevenue,
        totalPurchases,
        topPublications,
        averageOrderValue:
          totalPurchases > 0 ? totalRevenue / totalPurchases : 0,
      };
    } catch (error) {
      throw error;
    }
  }

  async getUserAnalytics(userId: string, startDate: Date, endDate: Date) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          publicationPurchases: {
            where: {
              purchasedAt: {
                gte: startDate,
                lte: endDate,
              },
            },
            include: {
              publication: true,
            },
          },
          createdPublications: {
            where: {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            },
          },
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const totalSpent = user.publicationPurchases.reduce((sum, purchase) => {
        return sum + purchase.amount;
      }, 0);

      const totalEarned = user.createdPublications.reduce(
        (sum, publication) => {
          return (
            sum +
            publication.downloads *
              (publication.discountPrice || publication.price)
          );
        },
        0
      );

      // Get recent activity from analytics events
      const recentActivity = await this.prisma.analyticsEvent.findMany({
        where: { userId },
        orderBy: { timestamp: "desc" },
        take: 20,
        select: {
          id: true,
          event: true,
          properties: true,
          timestamp: true,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
        purchases: user.publicationPurchases.length,
        totalSpent,
        publicationsUploaded: user.createdPublications.length,
        totalEarned,
        recentActivity: recentActivity.map((a) => ({
          id: a.id,
          event: a.event,
          data: a.properties,
          timestamp: a.timestamp,
        })),
      };
    } catch (error) {
      throw error;
    }
  }

  async getSystemMetrics() {
    try {
      const now = new Date();
      const lastHourTime = new Date(now.getTime() - 60 * 60 * 1000);
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get basic counts
      const totalUsers = await this.prisma.user.count();
      const totalPublications = await this.prisma.publication.count();
      const totalPurchases = await this.prisma.publicationPurchase.count();

      // Get recent activity
      const recentPurchases = await this.prisma.publicationPurchase.count({
        where: {
          purchasedAt: {
            gte: last24Hours,
          },
        },
      });

      const recentUsers = await this.prisma.user.count({
        where: {
          createdAt: {
            gte: last24Hours,
          },
        },
      });

      // Get active users based on analytics events
      const activeUsersLastHour = await this.prisma.analyticsEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { not: null },
          timestamp: { gte: lastHourTime },
        },
      });

      const activeUsersLast24Hours = await this.prisma.analyticsEvent.groupBy({
        by: ["userId"],
        where: {
          userId: { not: null },
          timestamp: { gte: last24Hours },
        },
      });

      return {
        totalUsers,
        totalPublications,
        totalPurchases,
        recentActivity: {
          newUsers24h: recentUsers,
          purchases24h: recentPurchases,
        },
        activeUsers: {
          lastHour: activeUsersLastHour.length,
          last24Hours: activeUsersLast24Hours.length,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Track user session in analytics
  async trackUserSession(userId: string, sessionData: any) {
    try {
      // Store session event in analytics
      await this.prisma.analyticsEvent.create({
        data: {
          event: "session_start",
          userId,
          sessionId: sessionData?.sessionId || null,
          properties: sessionData || null,
          ipAddress: sessionData?.ipAddress || null,
          userAgent: sessionData?.userAgent || null,
        },
      });

      this.metricsService.setActiveUsers("general", 1);

      return { success: true };
    } catch (error) {
      throw error;
    }
  }
}
