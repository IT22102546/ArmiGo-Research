import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { AppException } from "../../common/errors/app-exception";
import { ErrorCode } from "../../common/errors/error-codes.enum";

@Injectable()
export class UserManagementService {
  private readonly logger = new Logger(UserManagementService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all users with optional filtering
   */
  async getUsers(
    page: number = 1,
    limit: number = 20,
    role?: string,
    status?: string,
    search?: string
  ) {
    const where: any = {};

    if (role && role !== "ALL") {
      where.role = role;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await this.prisma.user.count({ where });
    const users = await this.prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parentProfile: true,
        hospitalProfile: {
          include: {
            hospital: true,
          },
        },
        district: true,
        zone: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      totalUsers,
      totalParents,
      totalHospitalAdmins,
      totalHospitals,
      totalChildren,
      activeUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: "PARENT" } }),
      this.prisma.user.count({ where: { role: "HOSPITAL_ADMIN" } }),
      this.prisma.hospital.count(),
      this.prisma.child.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
    ]);

    return {
      users: {
        total: totalUsers,
        parents: totalParents,
        hospitalAdmins: totalHospitalAdmins,
        active: activeUsers,
      },
      hospitals: totalHospitals,
      children: totalChildren,
    };
  }

  /**
   * Get hospital details with children and staff
   */
  async getHospitalDetails(hospitalId: string) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id: hospitalId },
      include: {
        adminProfile: {
          include: {
            user: {
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
        subHospitals: true,
        staff: {
          where: { isActive: true },
        },
        children: {
          include: {
            parent: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
              },
            },
          },
        },
        devices: true,
      },
    });

    if (!hospital) {
      throw AppException.notFound(ErrorCode.HOSPITAL_NOT_FOUND, "Hospital not found");
    }

    return hospital;
  }

  /**
   * Get child details with therapy progress
   */
  async getChildDetails(childId: string) {
    const child = await this.prisma.child.findUnique({
      where: { id: childId },
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        hospital: true,
        subHospital: true,
        therapyPrograms: {
          include: {
            sessions: {
              orderBy: { sessionDate: "desc" },
              take: 10,
            },
          },
        },
        deviceAssignments: {
          include: {
            device: true,
          },
        },
        progressRecords: {
          orderBy: { recordDate: "desc" },
        },
        appointments: {
          orderBy: { scheduledDate: "desc" },
          take: 10,
        },
      },
    });

    if (!child) {
      throw AppException.notFound(ErrorCode.CHILD_NOT_FOUND, "Child not found");
    }

    return child;
  }

  /**
   * Get all hospitals with optional filtering
   */
  async getHospitals(
    page: number = 1,
    limit: number = 20,
    status?: string,
    search?: string
  ) {
    const where: any = {};

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await this.prisma.hospital.count({ where });
    const hospitals = await this.prisma.hospital.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        district: true,
        zone: true,
        adminProfile: {
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
        _count: {
          select: {
            children: true,
            staff: true,
            subHospitals: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      data: hospitals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all children with optional filtering
   */
  async getChildren(
    page: number = 1,
    limit: number = 20,
    hospitalId?: string,
    search?: string
  ) {
    const where: any = {};

    if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await this.prisma.child.count({ where });
    const children = await this.prisma.child.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        parent: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        hospital: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            therapyPrograms: true,
            deviceAssignments: true,
            appointments: true,
          },
        },
      },
      orderBy: {
        enrolledAt: "desc",
      },
    });

    return {
      data: children,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get device inventory with assignments
   */
  async getDevices(
    page: number = 1,
    limit: number = 20,
    hospitalId?: string,
    deviceType?: string
  ) {
    const where: any = {};

    if (hospitalId) {
      where.hospitalId = hospitalId;
    }

    if (deviceType) {
      where.deviceType = deviceType;
    }

    const total = await this.prisma.device.count({ where });
const devices = await this.prisma.device.findMany({
  where,
  skip: (page - 1) * limit,
  take: limit,
  include: {
    hospital: {
      select: {
        id: true,
        name: true,
      },
    },
    assignments: {
      where: { isActive: true },
      include: {
        child: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    },
  },
  orderBy: {
    // Use a field that exists in your schema
    serialNumber: "asc", // or any other field
  },
});

    return {
      data: devices,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get therapy sessions for a child
   */
  async getChildTherapySessions(
    childId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const where = { childId };

    const total = await this.prisma.therapySession.count({ where });
    const sessions = await this.prisma.therapySession.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        program: true,
        device: true,
        movements: true,
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        sessionDate: "desc",
      },
    });

    return {
      data: sessions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get progress records for a child
   */
  async getChildProgress(childId: string) {
    const progress = await this.prisma.progressRecord.findMany({
      where: { childId },
      include: {
        program: true,
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        recordDate: "desc",
      },
    });

    // Calculate improvement trends
    const movements = [...new Set(progress.map(p => p.movementType))];
    const trends = movements.map(movement => {
      const records = progress.filter(p => p.movementType === movement);
      const first = records[records.length - 1];
      const last = records[0];
     const improvement = first && last && first.baselineValue && last.currentValue
  ? ((last.currentValue - first.baselineValue) / first.baselineValue) * 100
  : 0;

      return {
        movement,
        firstRecord: first,
        lastRecord: last,
        improvement: improvement.toFixed(1) + '%',
      };
    });

    return {
      records: progress,
      trends,
      totalRecords: progress.length,
    };
  }
}