// src/modules/notifications/notifications.service.ts
import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { EmailService } from "./services/email.service";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  private get notificationModel() {
    return (this.prisma as any).notification;
  }

  private get pushTokenModel() {
    return (this.prisma as any).pushToken;
  }

  /**
   * Register or update a push notification token for a user.
   */
  async registerPushToken(userId: string, token: string, platform = "expo") {
    this.logger.log(`Registering push token for user ${userId}`);

    // Deactivate other tokens for this user (one active token per user)
    await this.pushTokenModel.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Upsert the token
    await this.pushTokenModel.upsert({
      where: {
        userId_token: { userId, token },
      },
      create: {
        userId,
        token,
        platform,
        isActive: true,
      },
      update: {
        isActive: true,
        platform,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Send push notification to a user via Expo Push Notification service.
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ) {
    try {
      const tokens = await this.pushTokenModel.findMany({
        where: { userId, isActive: true },
        select: { token: true },
      });

      if (!tokens.length) {
        this.logger.debug(`No push tokens found for user ${userId}`);
        return;
      }

      const messages = tokens.map((t: { token: string }) => ({
        to: t.token,
        sound: "default",
        title,
        body,
        data: data || {},
      }));

      // Send via Expo Push Notification API
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      const result = await response.json();
      this.logger.log(
        `Push notification sent to user ${userId}: ${JSON.stringify(result?.data?.[0]?.status || "sent")}`
      );
    } catch (err: any) {
      this.logger.warn(
        `Failed to send push notification to user ${userId}: ${err?.message}`
      );
    }
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string;
    metadata?: Record<string, any>;
  }) {
    this.logger.log(`Creating notification for user ${data.userId}: ${data.title}`);

    const notification = await this.notificationModel.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "GENERAL",
        status: "UNREAD",
        isRead: false,
        link: data.link,
        metadata: data.metadata,
        sentAt: new Date(),
      },
    });

    // Send push notification (non-blocking)
    this.sendPushNotification(data.userId, data.title, data.message, {
      notificationId: notification.id,
      type: data.type,
      ...data.metadata,
    }).catch(() => {});

    return notification;
  }

  /**
   * Send a notification to the hospital admin linked to a given hospital.
   * Silently skips if there is no admin profile for the hospital.
   */
  async notifyHospitalAdmin(
    hospitalId: string | null | undefined,
    data: { title: string; message: string; type: string; metadata?: Record<string, any> },
  ) {
    if (!hospitalId) return;

    try {
      const profile = await this.prisma.hospitalProfile.findFirst({
        where: { hospitalId },
        select: { userId: true },
      });

      if (!profile?.userId) return;

      await this.createNotification({
        userId: profile.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        metadata: data.metadata,
      });
    } catch (err: any) {
      this.logger.warn(`Failed to notify hospital admin for hospital ${hospitalId}: ${err?.message}`);
    }
  }

  async getMyNotifications(userId: string, params?: { isRead?: boolean; type?: string }) {
    return this.notificationModel.findMany({
      where: {
        userId,
        ...(params?.isRead !== undefined ? { isRead: params.isRead } : {}),
        ...(params?.type ? { type: params.type } : {}),
      },
      orderBy: [{ sentAt: "desc" }],
    });
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationModel.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    return this.notificationModel.update({
      where: { id },
      data: {
        isRead: true,
        status: "READ",
        readAt: new Date(),
        deliveredAt: new Date(),
      },
    });
  }

  async markAllAsRead(userId: string) {
    await this.notificationModel.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        status: "READ",
        readAt: new Date(),
        deliveredAt: new Date(),
      },
    });

    return { message: "All notifications marked as read" };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationModel.count({
      where: { userId, isRead: false },
    });

    return { count };
  }

  async deleteNotification(id: string, userId: string) {
    const notification = await this.notificationModel.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    await this.notificationModel.delete({ where: { id } });
    return { message: "Notification deleted successfully" };
  }

  async getAdminAll(filters: {
    page?: number;
    limit?: number;
    type?: string;
    status?: string;
    role?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    hospitalId?: string;
  }) {
    const page = Number(filters?.page || 1);
    const limit = Number(filters?.limit || 20);
    const skip = (page - 1) * limit;

    const baseWhere: any = {
      ...(filters?.type ? { type: filters.type } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.role ? { user: { role: filters.role as any } } : {}),
    };

    const andWhere: any[] = [];

    if (filters?.dateFrom || filters?.dateTo) {
      baseWhere.sentAt = {
        ...(filters?.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
        ...(filters?.dateTo ? { lte: new Date(filters.dateTo) } : {}),
      };
    }

    if (filters?.search?.trim()) {
      const search = filters.search.trim();
      andWhere.push({
        OR: [
        { title: { contains: search, mode: "insensitive" } },
        { message: { contains: search, mode: "insensitive" } },
        { user: { firstName: { contains: search, mode: "insensitive" } } },
        { user: { lastName: { contains: search, mode: "insensitive" } } },
        { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      });
    }

    if (filters?.hospitalId) {
      andWhere.push({
        OR: [
          {
            user: {
              hospitalProfile: {
                hospitalId: filters.hospitalId,
              },
            },
          },
          {
            user: {
              parentProfile: {
                children: {
                  some: {
                    hospitalId: filters.hospitalId,
                  },
                },
              },
            },
          },
        ],
      });
    }

    const where: any =
      andWhere.length > 0
        ? { AND: [baseWhere, ...andWhere] }
        : baseWhere;

    const [data, total] = await Promise.all([
      this.notificationModel.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: [{ sentAt: "desc" }],
        skip,
        take: limit,
      }),
      this.notificationModel.count({ where }),
    ]);

    return {
      data,
      total,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getAdminDetail(id: string, hospitalId?: string) {
    const notification = await this.notificationModel.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            hospitalProfile: {
              select: {
                hospitalId: true,
              },
            },
            parentProfile: {
              select: {
                children: {
                  select: {
                    hospitalId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!notification) {
      throw new NotFoundException("Notification not found");
    }

    if (hospitalId) {
      const recipient = notification.user as any;
      const recipientHospitalId = recipient?.hospitalProfile?.hospitalId;
      const recipientChildHospitalIds = Array.isArray(recipient?.parentProfile?.children)
        ? recipient.parentProfile.children
            .map((child: any) => child?.hospitalId)
            .filter((value: any): value is string => Boolean(value))
        : [];

      const isInScope =
        recipientHospitalId === hospitalId ||
        recipientChildHospitalIds.includes(hospitalId);

      if (!isInScope) {
        throw new NotFoundException("Notification not found");
      }
    }

    return notification;
  }

  async getAdminStats(hospitalId?: string) {
    const scopedWhere = hospitalId
      ? {
          OR: [
            {
              user: {
                hospitalProfile: {
                  hospitalId,
                },
              },
            },
            {
              user: {
                parentProfile: {
                  children: {
                    some: {
                      hospitalId,
                    },
                  },
                },
              },
            },
          ],
        }
      : {};

    const [total, unread, read] = await Promise.all([
      this.notificationModel.count({ where: scopedWhere }),
      this.notificationModel.count({ where: { ...scopedWhere, isRead: false } }),
      this.notificationModel.count({ where: { ...scopedWhere, isRead: true } }),
    ]);

    return { total, unread, read };
  }

  async getNotificationTargetOptions(hospitalId?: string) {
    const [patients, hospitals] = await Promise.all([
      this.prisma.child.findMany({
        where: {
          isActive: true,
          ...(hospitalId ? { hospitalId } : {}),
          parent: {
            status: "ACTIVE",
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          parentId: true,
          hospital: {
            select: { id: true, name: true },
          },
          parent: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              role: true,
              status: true,
            },
          },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      this.prisma.hospital.findMany({
        where: {
          status: "ACTIVE",
          ...(hospitalId ? { id: hospitalId } : {}),
        },
        select: {
          id: true,
          name: true,
          adminProfile: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      patients: patients.map((patient) => ({
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        parentUserId: patient.parentId,
        parentName: patient.parent
          ? `${patient.parent.firstName} ${patient.parent.lastName}`
          : null,
        hospitalId: patient.hospital?.id || null,
        hospitalName: patient.hospital?.name || null,
      })),
      hospitals: hospitals.map((hospital) => ({
        id: hospital.id,
        name: hospital.name,
        adminUserId:
          hospital.adminProfile?.user?.status === "ACTIVE"
            ? hospital.adminProfile?.user?.id || null
            : null,
        adminName: hospital.adminProfile?.user
          ? `${hospital.adminProfile.user.firstName} ${hospital.adminProfile.user.lastName}`
          : null,
      })),
    };
  }

  async sendByTargets(payload: {
    title: string;
    message: string;
    type?: string;
    patientIds?: string[];
    hospitalIds?: string[];
    hospitalAdminUserIds?: string[];
    audienceScope?: "DEFAULT" | "HOSPITAL_ONLY";
    senderUserId?: string;
    hospitalId?: string;
  }) {
    let patientIds = payload.patientIds || [];
    let hospitalIds = payload.hospitalIds || [];
    const hospitalAdminUserIds = payload.hospitalAdminUserIds || [];

    if (payload.hospitalId) {
      if (payload.audienceScope === "HOSPITAL_ONLY") {
        hospitalIds = [payload.hospitalId];
      } else {
        hospitalIds = hospitalIds.filter((id) => id === payload.hospitalId);
      }

      if (patientIds.length > 0) {
        const allowedPatients = await this.prisma.child.findMany({
          where: {
            id: { in: patientIds },
            hospitalId: payload.hospitalId,
          },
          select: { id: true },
        });

        patientIds = allowedPatients.map((item) => item.id);
      }
    }

    const [patients, hospitals, hospitalChildren, selectedHospitals] = await Promise.all([
      patientIds.length
        ? this.prisma.child.findMany({
            where: { id: { in: patientIds } },
            select: { parentId: true, hospitalId: true },
          })
        : Promise.resolve([]),
      hospitalIds.length
        ? this.prisma.hospitalProfile.findMany({
            where: { hospitalId: { in: hospitalIds } },
            select: { userId: true },
          })
        : Promise.resolve([]),
      hospitalIds.length
        ? this.prisma.child.findMany({
            where: { hospitalId: { in: hospitalIds } },
            select: { parentId: true },
          })
        : Promise.resolve([]),
      hospitalIds.length
        ? this.prisma.hospital.findMany({
            where: { id: { in: hospitalIds } },
            select: { id: true, adminEmail: true },
          })
        : Promise.resolve([]),
    ]);

    const adminEmails = selectedHospitals
      .map((hospital) => hospital.adminEmail)
      .filter((email): email is string => Boolean(email));

    const normalizedAdminEmails = new Set(
      adminEmails.map((email) => email.trim().toLowerCase())
    );

    const fallbackHospitalAdmins = hospitalIds.length
      ? (
          await this.prisma.user.findMany({
            where: {
              role: "HOSPITAL_ADMIN",
            },
            select: {
              id: true,
              email: true,
              hospitalProfile: {
                select: {
                  hospitalId: true,
                },
              },
            },
          })
        ).filter((user) => {
          const linkedHospitalId = user.hospitalProfile?.hospitalId;
          const linkedToSelectedHospital =
            Boolean(linkedHospitalId) && hospitalIds.includes(linkedHospitalId as string);

          const emailMatch = user.email
            ? normalizedAdminEmails.has(user.email.trim().toLowerCase())
            : false;

          return linkedToSelectedHospital || emailMatch;
        })
      : [];

    const patientHospitalIds = Array.from(
      new Set(
        patients
          .map((item) => item.hospitalId)
          .filter((item): item is string => Boolean(item))
      )
    );

    const patientHospitals = patientHospitalIds.length
      ? await this.prisma.hospitalProfile.findMany({
          where: { hospitalId: { in: patientHospitalIds } },
          select: { userId: true },
        })
      : [];

    const recipientIds = new Set<string>();

    hospitalAdminUserIds.forEach((userId) => {
      if (userId) recipientIds.add(userId);
    });

    const addHospitalAdmins = () => {
      hospitals.forEach((item) => {
        if (item.userId) recipientIds.add(item.userId);
      });
      fallbackHospitalAdmins.forEach((item) => {
        if (item.id) recipientIds.add(item.id);
      });

      if (recipientIds.size === 0 && hospitalIds.length > 0) {
        this.logger.warn(
          `No linked hospital admins found for hospitals [${hospitalIds.join(",")}] - falling back to all hospital admins`
        );
      }
    };

    if (payload.audienceScope === "HOSPITAL_ONLY") {
      addHospitalAdmins();
    } else {
      patients.forEach((item) => {
        if (item.parentId) recipientIds.add(item.parentId);
      });
      if (!payload.hospitalId) {
        addHospitalAdmins();
        hospitalChildren.forEach((item) => {
          if (item.parentId) recipientIds.add(item.parentId);
        });
      }
      patientHospitals.forEach((item) => {
        if (item.userId) recipientIds.add(item.userId);
      });
    }

    const activeRecipients = await this.prisma.user.findMany({
      where: {
        id: { in: Array.from(recipientIds) },
        status: "ACTIVE",
      },
      select: { id: true },
    });

    const recipientUserIds = activeRecipients.map((user) => user.id);

    if (recipientUserIds.length === 0) {
      if (hospitalIds.length > 0) {
        const emailSendResults = await Promise.all(
          adminEmails.map((email) =>
            this.emailService.sendEmail(
              email,
              payload.title,
              payload.message
            )
          )
        );

        const emailSentCount = emailSendResults.length;

        return {
          sent: emailSentCount,
          recipients: emailSentCount,
          message:
            emailSentCount > 0
              ? "Notifications sent to hospital targets"
              : "No hospital admin recipients found for selected hospitals",
        };
      }

      return { sent: 0, recipients: 0, message: "No target recipients found" };
    }

    const now = new Date();
    await this.notificationModel.createMany({
      data: recipientUserIds.map((userId) => ({
        userId,
        title: payload.title,
        message: payload.message,
        type: payload.type || "GENERAL",
        status: "UNREAD",
        isRead: false,
        sentAt: now,
      })),
    });

    // Send push notifications to all recipients (non-blocking)
    Promise.allSettled(
      recipientUserIds.map((userId) =>
        this.sendPushNotification(userId, payload.title, payload.message, {
          type: payload.type || "GENERAL",
        })
      )
    ).catch(() => {});

    return {
      sent: recipientUserIds.length,
      recipients: recipientUserIds.length,
      message: "Notifications sent successfully",
    };
  }

  async updateAdminNotification(
    id: string,
    payload: {
      title?: string;
      message?: string;
      type?: string;
      status?: "UNREAD" | "READ" | "ARCHIVED";
      isRead?: boolean;
    }
  ) {
    const existing = await this.notificationModel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Notification not found");
    }

    return this.notificationModel.update({
      where: { id },
      data: {
        ...(payload.title !== undefined ? { title: payload.title } : {}),
        ...(payload.message !== undefined ? { message: payload.message } : {}),
        ...(payload.type !== undefined ? { type: payload.type } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
        ...(payload.isRead !== undefined
          ? {
              isRead: payload.isRead,
              readAt: payload.isRead ? new Date() : null,
              status: payload.isRead ? "READ" : payload.status || "UNREAD",
            }
          : {}),
      },
    });
  }

  async deleteAdminNotification(id: string) {
    const existing = await this.notificationModel.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException("Notification not found");
    }

    await this.notificationModel.delete({ where: { id } });
    return { message: "Notification deleted successfully" };
  }

  getPreferences() {
    return {
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      notificationTypes: ["GENERAL", "ANNOUNCEMENT", "SYSTEM"],
    };
  }

  updatePreferences(data: Record<string, any>) {
    return {
      emailNotifications: data?.emailNotifications ?? true,
      pushNotifications: data?.pushNotifications ?? true,
      smsNotifications: data?.smsNotifications ?? false,
      notificationTypes: data?.notificationTypes ?? ["GENERAL", "ANNOUNCEMENT", "SYSTEM"],
    };
  }

  async notifyAboutApproval(
    userId: string,
    title: string,
    name: string,
    approved: boolean,
    reason?: string
  ) {
    const message = approved
      ? `Your ${title} has been approved! Welcome to ArmiGo.`
      : `Your ${title} has been rejected. Reason: ${reason || "Not specified"}`;

    await this.createNotification({
      userId,
      title: `${title} ${approved ? "Approved" : "Rejected"}`,
      message,
      type: "GENERAL",
    });

    // You can also send email if needed
    // This would require user email lookup
  }
}