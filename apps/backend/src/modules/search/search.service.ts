import { Injectable } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { UserRole } from "@prisma/client";

export interface SearchResult {
  entity: string;
  results: any[];
  total: number;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(
    query: string,
    entities?: string[],
    limit: number = 5,
    user?: any
  ): Promise<SearchResult[]> {
    const searchEntities = entities || [
      "users",
      "classes",
      "exams",
      "timetables",
      "publications",
      "payments",
      "subjects",
    ];

    const results: SearchResult[] = [];

    // Search Users
    if (searchEntities.includes("users")) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: query, mode: "insensitive" } },
            { lastName: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          avatar: true,
        },
        take: limit,
      });

      const formattedUsers = users.map((u) => ({
        ...u,
        name: `${u.firstName} ${u.lastName}`,
      }));

      results.push({
        entity: "users",
        results: formattedUsers,
        total: formattedUsers.length,
      });
    }

    // Search Classes
    if (searchEntities.includes("classes")) {
      const classes = await this.prisma.class.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { subject: { name: { contains: query, mode: "insensitive" } } },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          description: true,
          batch: true,
          grade: {
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
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
        take: limit,
      });

      results.push({
        entity: "classes",
        results: classes,
        total: classes.length,
      });
    }

    // Search Exams
    if (searchEntities.includes("exams")) {
      const exams = await this.prisma.exam.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { subject: { name: { contains: query, mode: "insensitive" } } },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          duration: true,
          totalMarks: true,
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        take: limit,
      });

      results.push({
        entity: "exams",
        results: exams,
        total: exams.length,
      });
    }

    // Search Timetables
    if (searchEntities.includes("timetables")) {
      const timetables = await this.prisma.timetable.findMany({
        where: {
          OR: [
            { subject: { name: { contains: query, mode: "insensitive" } } },
            {
              teacher: { firstName: { contains: query, mode: "insensitive" } },
            },
            { teacher: { lastName: { contains: query, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          batch: true,
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          grade: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        take: limit,
      });

      results.push({
        entity: "timetables",
        results: timetables,
        total: timetables.length,
      });
    }

    // Search Publications
    if (searchEntities.includes("publications")) {
      const publications = await this.prisma.publication.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { author: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          shortDescription: true,
          coverImage: true,
          price: true,
          discountPrice: true,
          author: true,
          status: true,
          downloads: true,
        },
        take: limit,
      });

      results.push({
        entity: "publications",
        results: publications,
        total: publications.length,
      });
    }

    // Search Payments (Admin only)
    if (
      searchEntities.includes("payments") &&
      user &&
      (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
    ) {
      const payments = await this.prisma.payment.findMany({
        where: {
          OR: [
            { user: { firstName: { contains: query, mode: "insensitive" } } },
            { user: { lastName: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          amount: true,
          currency: true,
          status: true,
          method: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        take: limit,
      });

      results.push({
        entity: "payments",
        results: payments,
        total: payments.length,
      });
    }

    // Search Subjects
    if (searchEntities.includes("subjects")) {
      const subjects = await this.prisma.subject.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { code: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          code: true,
          description: true,
          _count: {
            select: {
              classes: true,
            },
          },
        },
        take: limit,
      });

      results.push({
        entity: "subjects",
        results: subjects,
        total: subjects.length,
      });
    }

    return results;
  }
}
