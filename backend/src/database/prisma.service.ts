import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Helper method for soft deletes (if needed)
  async softDelete(model: string, where: any) {
    return this[model].update({
      where,
      data: {
        deletedAt: new Date(),
      },
    });
  }

  // Helper method for pagination
  async paginate(model: string, args: any, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await Promise.all([
      this[model].findMany({
        ...args,
        skip,
        take,
      }),
      this[model].count({
        where: args.where,
      }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
