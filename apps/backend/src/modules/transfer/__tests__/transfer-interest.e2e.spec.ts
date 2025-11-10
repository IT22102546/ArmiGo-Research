import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../database/prisma.service';

describe('Transfer Interest API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teacherAToken: string;
  let teacherBToken: string;
  let adminToken: string;
  let teacherAId: string;
  let teacherBId: string;
  let transferRequestId: string;
  let acceptanceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Create test users and login
    // Teacher A
    const teacherARes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone: '+94771234567',
        email: 'teacherA@test.com',
        password: 'Test@1234',
        firstName: 'Teacher',
        lastName: 'A',
        role: 'TEACHER',
      });
    teacherAId = teacherARes.body.user.id;

    const teacherALoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        phone: '+94771234567',
        password: 'Test@1234',
      });
    teacherAToken = teacherALoginRes.body.accessToken;

    // Teacher B
    const teacherBRes = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        phone: '+94771234568',
        email: 'teacherB@test.com',
        password: 'Test@1234',
        firstName: 'Teacher',
        lastName: 'B',
        role: 'TEACHER',
      });
    teacherBId = teacherBRes.body.user.id;

    const teacherBLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        phone: '+94771234568',
        password: 'Test@1234',
      });
    teacherBToken = teacherBLoginRes.body.accessToken;

    // Admin
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        phone: '+94771111111', // Existing admin from seed
        password: 'admin123',
      });
    adminToken = adminLoginRes.body.accessToken;

    // Create a transfer request by Teacher A
    const createRes = await request(app.getHttpServer())
      .post('/transfer')
      .set('Authorization', `Bearer ${teacherAToken}`)
      .send({
        registrationId: 'TR-A-001',
        currentSchool: 'School A',
        currentDistrict: 'Colombo',
        currentZone: 'Colombo',
        fromZone: 'Colombo',
        toZones: ['Gampaha', 'Kandy'],
        subject: 'Mathematics',
        medium: 'Sinhala',
        level: 'A/L',
        yearsOfService: 5,
        qualifications: ['B.Sc', 'PGDE'],
      });
    transferRequestId = createRes.body.id;

    // Admin verifies the request
    await request(app.getHttpServer())
      .post(`/transfer/${transferRequestId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        verified: true,
        notes: 'Verified by admin',
      });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.transferAcceptance.deleteMany();
    await prisma.transferRequest.deleteMany();
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['teacherA@test.com', 'teacherB@test.com'],
        },
      },
    });
    await app.close();
  });

  describe('Send Interest', () => {
    it('should allow Teacher B to send interest to Teacher A\'s request', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transfer/interests/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({
          message: 'I am interested in swapping with you!',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent successfully');

      // Verify acceptance was created
      const acceptance = await prisma.transferAcceptance.findFirst({
        where: {
          transferRequestId,
          acceptorId: teacherBId,
        },
      });
      expect(acceptance).toBeDefined();
      expect(acceptance?.status).toBe('PENDING');
      acceptanceId = acceptance!.id;
    });

    it('should not allow duplicate interests', async () => {
      await request(app.getHttpServer())
        .post(`/transfer/interests/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({
          message: 'Another interest',
        })
        .expect(400);
    });

    it('should not allow sending interest to own request', async () => {
      await request(app.getHttpServer())
        .post(`/transfer/interests/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          message: 'Interest to my own request',
        })
        .expect(400);
    });
  });

  describe('View Received Interests', () => {
    it('should allow Teacher A to view received interests', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transfer/interests/received/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('PENDING');
      expect(response.body[0].message).toContain('interested in swapping');
      expect(response.body[0].acceptor.id).toBe(teacherBId);
    });

    it('should not allow non-owner to view received interests', async () => {
      await request(app.getHttpServer())
        .get(`/transfer/interests/received/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .expect(403);
    });
  });

  describe('View Sent Interests', () => {
    it('should allow Teacher B to view sent interests', async () => {
      const response = await request(app.getHttpServer())
        .get('/transfer/interests/sent')
        .set('Authorization', `Bearer ${teacherBToken}`)
        .expect(200);

      expect(response.body.length).toBeGreaterThan(0);
      const interest = response.body.find(
        (i: any) => i.request.id === transferRequestId
      );
      expect(interest).toBeDefined();
      expect(interest.status).toBe('PENDING');
    });
  });

  describe('Accept Interest', () => {
    it('should allow Teacher A to accept Teacher B\'s interest', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transfer/interests/${acceptanceId}/accept`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('accepted');

      // Verify acceptance status updated
      const acceptance = await prisma.transferAcceptance.findUnique({
        where: { id: acceptanceId },
      });
      expect(acceptance?.status).toBe('APPROVED');
      expect(acceptance?.acceptedAt).toBeDefined();

      // Verify request status updated
      const request = await prisma.transferRequest.findUnique({
        where: { id: transferRequestId },
      });
      expect(request?.status).toBe('ACCEPTED');
    });

    it('should not allow non-owner to accept interests', async () => {
      await request(app.getHttpServer())
        .post(`/transfer/interests/${acceptanceId}/accept`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .expect(403);
    });

    it('should not allow accepting already accepted interest', async () => {
      await request(app.getHttpServer())
        .post(`/transfer/interests/${acceptanceId}/accept`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .expect(400);
    });
  });

  describe('Reject Interest', () => {
    let newTransferRequestId: string;
    let newAcceptanceId: string;

    beforeAll(async () => {
      // Create another request by Teacher B
      const createRes = await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({
          registrationId: 'TR-B-001',
          currentSchool: 'School B',
          currentDistrict: 'Gampaha',
          currentZone: 'Gampaha',
          fromZone: 'Gampaha',
          toZones: ['Colombo'],
          subject: 'Mathematics',
          medium: 'Sinhala',
          level: 'A/L',
          yearsOfService: 3,
        });
      newTransferRequestId = createRes.body.id;

      // Admin verifies
      await request(app.getHttpServer())
        .post(`/transfer/${newTransferRequestId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verified: true });

      // Teacher A sends interest
      await request(app.getHttpServer())
        .post(`/transfer/interests/${newTransferRequestId}`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({ message: 'Interested!' });

      const acceptance = await prisma.transferAcceptance.findFirst({
        where: {
          transferRequestId: newTransferRequestId,
          acceptorId: teacherAId,
        },
      });
      newAcceptanceId = acceptance!.id;
    });

    it('should allow Teacher B to reject Teacher A\'s interest', async () => {
      const response = await request(app.getHttpServer())
        .post(`/transfer/interests/${newAcceptanceId}/reject`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({
          message: 'Not a good match',
        })
        .expect(201);

      expect(response.body.success).toBe(true);

      // Verify status
      const acceptance = await prisma.transferAcceptance.findUnique({
        where: { id: newAcceptanceId },
      });
      expect(acceptance?.status).toBe('REJECTED');
    });
  });

  describe('Privacy Filtering', () => {
    it('should hide teacher details in public listing', async () => {
      // Create unauthenticated request or use Teacher C (not involved)
      const response = await request(app.getHttpServer())
        .get('/transfer/browse')
        .expect(200);

      const publicRequest = response.body.find(
        (r: any) => r.id === transferRequestId
      );

      // Should not see requester details
      expect(publicRequest?.requester).toBeNull();
      expect(publicRequest?.currentSchool).toBeNull();

      // Should see basic info
      expect(publicRequest?.fromZone).toBeDefined();
      expect(publicRequest?.subject).toBeDefined();
    });

    it('should show requester details after sending interest', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transfer/${transferRequestId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .expect(200);

      // Teacher B sent interest, should see Teacher A's details
      expect(response.body.requester).toBeDefined();
      expect(response.body.requester.firstName).toBe('Teacher');
      expect(response.body.requester.email).toBe('teacherA@test.com');
    });
  });

  describe('Pause Request', () => {
    let pauseTransferRequestId: string;

    beforeAll(async () => {
      const createRes = await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          registrationId: 'TR-PAUSE-001',
          currentSchool: 'School C',
          currentDistrict: 'Kandy',
          currentZone: 'Kandy',
          fromZone: 'Kandy',
          toZones: ['Colombo'],
          subject: 'Science',
          medium: 'English',
          level: 'O/L',
          yearsOfService: 2,
        });
      pauseTransferRequestId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/transfer/${pauseTransferRequestId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verified: true });
    });

    it('should allow pausing verified request', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transfer/interests/${pauseTransferRequestId}/pause`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          reason: 'Need to reconsider',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Edit Request', () => {
    let editTransferRequestId: string;

    beforeAll(async () => {
      const createRes = await request(app.getHttpServer())
        .post('/transfer')
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          registrationId: 'TR-EDIT-001',
          currentSchool: 'School D',
          currentDistrict: 'Jaffna',
          currentZone: 'Jaffna',
          fromZone: 'Jaffna',
          toZones: ['Colombo'],
          subject: 'Tamil',
          medium: 'Tamil',
          level: 'A/L',
          yearsOfService: 4,
        });
      editTransferRequestId = createRes.body.id;
    });

    it('should allow editing request without interests', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transfer/interests/${editTransferRequestId}/edit`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          toZones: ['Gampaha', 'Kandy'],
          notes: 'Updated preferences',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should not allow editing after receiving interests', async () => {
      // First get it verified
      await request(app.getHttpServer())
        .post(`/transfer/${editTransferRequestId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ verified: true });

      // Teacher B sends interest
      await request(app.getHttpServer())
        .post(`/transfer/interests/${editTransferRequestId}`)
        .set('Authorization', `Bearer ${teacherBToken}`)
        .send({ message: 'Interested!' });

      // Try to edit
      await request(app.getHttpServer())
        .patch(`/transfer/interests/${editTransferRequestId}/edit`)
        .set('Authorization', `Bearer ${teacherAToken}`)
        .send({
          toZones: ['Batticaloa'],
        })
        .expect(400);
    });
  });
});
