import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";

export interface JobInfo {
  id: string | number;
  name: string;
  data: any;
  progress: number;
  attempts: number;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  failedReason?: string;
  stacktrace?: string[];
  returnvalue?: any;
}

export interface JobsStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

@Injectable()
export class JobsMonitorService {
  constructor(
    @InjectQueue("email") private emailQueue: Queue,
    @InjectQueue("notifications") private notificationQueue: Queue,
    @InjectQueue("files") private fileQueue: Queue,
    @InjectQueue("exams") private examQueue: Queue
  ) {}

  private async getQueueJobs(queue: Queue, status: string): Promise<JobInfo[]> {
    let jobs: any[] = [];

    switch (status) {
      case "waiting":
        jobs = await queue.getWaiting();
        break;
      case "active":
        jobs = await queue.getActive();
        break;
      case "completed":
        jobs = await queue.getCompleted(0, 50); // Last 50 completed
        break;
      case "failed":
        jobs = await queue.getFailed(0, 50); // Last 50 failed
        break;
      case "delayed":
        jobs = await queue.getDelayed();
        break;
    }

    return jobs.map((job) => ({
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
    }));
  }

  async getAllJobs(status: string) {
    const queues = [
      { name: "email", queue: this.emailQueue },
      { name: "notifications", queue: this.notificationQueue },
      { name: "files", queue: this.fileQueue },
      { name: "exams", queue: this.examQueue },
    ];

    const results = await Promise.all(
      queues.map(async ({ name, queue }) => {
        const jobs = await this.getQueueJobs(queue, status);
        return jobs.map((job) => ({ ...job, queueName: name }));
      })
    );

    return results.flat();
  }

  async getJobById(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found in queue ${queueName}`);
    }

    return {
      id: job.id,
      name: job.name,
      data: job.data,
      progress: job.progress(),
      attempts: job.attemptsMade,
      timestamp: job.timestamp,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
      stacktrace: job.stacktrace,
      returnvalue: job.returnvalue,
      opts: job.opts,
      queueName,
    };
  }

  async getJobsStats(): Promise<JobsStats> {
    const queues = [
      this.emailQueue,
      this.notificationQueue,
      this.fileQueue,
      this.examQueue,
    ];

    const allCounts = await Promise.all(
      queues.map((queue) => queue.getJobCounts())
    );

    return allCounts.reduce(
      (acc, counts) => ({
        waiting: acc.waiting + (counts.waiting || 0),
        active: acc.active + (counts.active || 0),
        completed: acc.completed + (counts.completed || 0),
        failed: acc.failed + (counts.failed || 0),
        delayed: acc.delayed + (counts.delayed || 0),
      }),
      { waiting: 0, active: 0, completed: 0, failed: 0, delayed: 0 }
    );
  }

  async retryJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.retry();
    return { success: true, message: `Job ${jobId} queued for retry` };
  }

  async retryAllFailed() {
    const queues = [
      { name: "email", queue: this.emailQueue },
      { name: "notifications", queue: this.notificationQueue },
      { name: "files", queue: this.fileQueue },
      { name: "exams", queue: this.examQueue },
    ];

    let totalRetried = 0;

    for (const { queue } of queues) {
      const failedJobs = await queue.getFailed();
      for (const job of failedJobs) {
        await job.retry();
        totalRetried++;
      }
    }

    return { success: true, retried: totalRetried };
  }

  async removeJob(queueName: string, jobId: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    await job.remove();
    return { success: true, message: `Job ${jobId} removed` };
  }

  async cleanFailedJobs(grace: number = 0) {
    const queues = [
      this.emailQueue,
      this.notificationQueue,
      this.fileQueue,
      this.examQueue,
    ];

    let totalCleaned = 0;

    for (const queue of queues) {
      const cleaned = await queue.clean(grace, "failed");
      totalCleaned += cleaned.length;
    }

    return { success: true, cleaned: totalCleaned };
  }

  async pauseQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    return { success: true, message: `Queue ${queueName} paused` };
  }

  async resumeQueue(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    return { success: true, message: `Queue ${queueName} resumed` };
  }

  async getQueueStatus(queueName: string) {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const isPaused = await queue.isPaused();
    const counts = await queue.getJobCounts();

    return {
      name: queueName,
      paused: isPaused,
      counts,
    };
  }

  async getAllQueuesStatus() {
    const queues = [
      { name: "email", queue: this.emailQueue },
      { name: "notifications", queue: this.notificationQueue },
      { name: "files", queue: this.fileQueue },
      { name: "exams", queue: this.examQueue },
    ];

    return Promise.all(
      queues.map(async ({ name, queue }) => {
        const isPaused = await queue.isPaused();
        const counts = await queue.getJobCounts();
        return { name, paused: isPaused, counts };
      })
    );
  }

  private getQueue(queueName: string): Queue | null {
    switch (queueName) {
      case "email":
        return this.emailQueue;
      case "notifications":
        return this.notificationQueue;
      case "files":
        return this.fileQueue;
      case "exams":
        return this.examQueue;
      default:
        return null;
    }
  }
}
