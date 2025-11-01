/// <reference types="node" />
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting comprehensive database seeding...");

  // ================================
  // SUPER ADMIN
  // ================================
  const superAdminPassword = await bcrypt.hash("SuperAdmin123!@#", 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: "superadmin@learnup.com" },
    update: {},
    create: {
      email: "superadmin@learnup.com",
      password: superAdminPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234567",
      dateOfBirth: new Date("1985-01-15"),
      bio: "System Super Administrator with full access",
    },
  });
  console.log("✅ Super Admin created:", superAdmin.email);

  // ================================
  // ADMIN
  // ================================
  const adminPassword = await bcrypt.hash("Admin123!@#", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@learnup.com" },
    update: {},
    create: {
      email: "admin@learnup.com",
      password: adminPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234568",
      dateOfBirth: new Date("1988-03-20"),
      bio: "Institution Administrator",
    },
  });
  console.log("✅ Admin created:", admin.email);

  // ================================
  // INTERNAL TEACHERS (2)
  // ================================
  const internalTeacher1Password = await bcrypt.hash("Teacher123!@#", 12);
  const internalTeacher1 = await prisma.user.upsert({
    where: { email: "teacher.internal1@learnup.com" },
    update: {},
    create: {
      email: "teacher.internal1@learnup.com",
      password: internalTeacher1Password,
      firstName: "John",
      lastName: "Smith",
      role: "INTERNAL_TEACHER",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234569",
      dateOfBirth: new Date("1990-05-10"),
      bio: "Computer Science Teacher specializing in Programming",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: internalTeacher1.id },
    update: {},
    create: {
      userId: internalTeacher1.id,
      employeeId: "EMP001",
      department: "Computer Science",
      specialization: "Software Engineering & Programming",
      experience: 8,
      qualifications: "M.S. Computer Science, B.S. Software Engineering",
      canCreateExams: true,
      canMonitorExams: true,
      canManageClasses: true,
      maxStudentsPerClass: 40,
      isExternal: false,
    },
  });
  console.log("✅ Internal Teacher 1 created:", internalTeacher1.email);

  const internalTeacher2Password = await bcrypt.hash("Teacher123!@#", 12);
  const internalTeacher2 = await prisma.user.upsert({
    where: { email: "teacher.internal2@learnup.com" },
    update: {},
    create: {
      email: "teacher.internal2@learnup.com",
      password: internalTeacher2Password,
      firstName: "Emily",
      lastName: "Johnson",
      role: "INTERNAL_TEACHER",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234570",
      dateOfBirth: new Date("1987-09-15"),
      bio: "Mathematics Teacher with focus on Advanced Calculus",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: internalTeacher2.id },
    update: {},
    create: {
      userId: internalTeacher2.id,
      employeeId: "EMP002",
      department: "Mathematics",
      specialization: "Advanced Mathematics & Statistics",
      experience: 12,
      qualifications: "Ph.D. Mathematics, M.S. Applied Mathematics",
      canCreateExams: true,
      canMonitorExams: true,
      canManageClasses: true,
      maxStudentsPerClass: 35,
      isExternal: false,
    },
  });
  console.log("✅ Internal Teacher 2 created:", internalTeacher2.email);

  // ================================
  // EXTERNAL TEACHERS (2)
  // ================================
  const externalTeacher1Password = await bcrypt.hash("Teacher123!@#", 12);
  const externalTeacher1 = await prisma.user.upsert({
    where: { email: "teacher.external1@otherschool.com" },
    update: {},
    create: {
      email: "teacher.external1@otherschool.com",
      password: externalTeacher1Password,
      firstName: "Sarah",
      lastName: "Williams",
      role: "EXTERNAL_TEACHER",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234571",
      dateOfBirth: new Date("1992-11-25"),
      bio: "Physics Teacher from External Institution",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: externalTeacher1.id },
    update: {},
    create: {
      userId: externalTeacher1.id,
      employeeId: "EXT001",
      department: "Physics",
      specialization: "Quantum Physics & Thermodynamics",
      experience: 6,
      qualifications: "M.S. Physics, B.S. Applied Physics",
      canCreateExams: true,
      canMonitorExams: false, // Limited permissions
      canManageClasses: false, // Cannot manage classes
      maxStudentsPerClass: 30,
      isExternal: true,
      sourceInstitution: "Royal College",
    },
  });
  console.log("✅ External Teacher 1 created:", externalTeacher1.email);

  const externalTeacher2Password = await bcrypt.hash("Teacher123!@#", 12);
  const externalTeacher2 = await prisma.user.upsert({
    where: { email: "teacher.external2@anotherSchool.com" },
    update: {},
    create: {
      email: "teacher.external2@anotherSchool.com",
      password: externalTeacher2Password,
      firstName: "Michael",
      lastName: "Brown",
      role: "EXTERNAL_TEACHER",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234572",
      dateOfBirth: new Date("1989-07-08"),
      bio: "Chemistry Teacher from Partner Institution",
    },
  });

  await prisma.teacherProfile.upsert({
    where: { userId: externalTeacher2.id },
    update: {},
    create: {
      userId: externalTeacher2.id,
      employeeId: "EXT002",
      department: "Chemistry",
      specialization: "Organic Chemistry & Biochemistry",
      experience: 10,
      qualifications: "Ph.D. Chemistry, M.S. Biochemistry",
      canCreateExams: true,
      canMonitorExams: false,
      canManageClasses: false,
      maxStudentsPerClass: 25,
      isExternal: true,
      sourceInstitution: "Colombo International School",
    },
  });
  console.log("✅ External Teacher 2 created:", externalTeacher2.email);

  // ================================
  // INTERNAL STUDENTS (3)
  // ================================
  const internalStudent1Password = await bcrypt.hash("Student123!@#", 12);
  const internalStudent1 = await prisma.user.upsert({
    where: { email: "student.internal1@learnup.com" },
    update: {},
    create: {
      email: "student.internal1@learnup.com",
      password: internalStudent1Password,
      firstName: "Alice",
      lastName: "Anderson",
      role: "INTERNAL_STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234573",
      dateOfBirth: new Date("2007-03-12"),
      bio: "Grade 12 student interested in Computer Science",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: internalStudent1.id },
    update: {},
    create: {
      userId: internalStudent1.id,
      studentId: "STU001",
      grade: "12",
      academicYear: "2024-2025",
      guardianName: "Robert Anderson",
      guardianPhone: "+94771111001",
      guardianEmail: "robert.anderson@email.com",
      currentGPA: 3.8,
      totalCredits: 120,
      isExternal: false,
    },
  });
  console.log("✅ Internal Student 1 created:", internalStudent1.email);

  const internalStudent2Password = await bcrypt.hash("Student123!@#", 12);
  const internalStudent2 = await prisma.user.upsert({
    where: { email: "student.internal2@learnup.com" },
    update: {},
    create: {
      email: "student.internal2@learnup.com",
      password: internalStudent2Password,
      firstName: "Bob",
      lastName: "Davis",
      role: "INTERNAL_STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234574",
      dateOfBirth: new Date("2007-08-20"),
      bio: "Grade 11 student with passion for Mathematics",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: internalStudent2.id },
    update: {},
    create: {
      userId: internalStudent2.id,
      studentId: "STU002",
      grade: "11",
      academicYear: "2024-2025",
      guardianName: "Linda Davis",
      guardianPhone: "+94771111002",
      guardianEmail: "linda.davis@email.com",
      currentGPA: 3.6,
      totalCredits: 90,
      isExternal: false,
    },
  });
  console.log("✅ Internal Student 2 created:", internalStudent2.email);

  const internalStudent3Password = await bcrypt.hash("Student123!@#", 12);
  const internalStudent3 = await prisma.user.upsert({
    where: { email: "student.internal3@learnup.com" },
    update: {},
    create: {
      email: "student.internal3@learnup.com",
      password: internalStudent3Password,
      firstName: "Charlie",
      lastName: "Wilson",
      role: "INTERNAL_STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234575",
      dateOfBirth: new Date("2006-12-05"),
      bio: "Grade 13 student preparing for university",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: internalStudent3.id },
    update: {},
    create: {
      userId: internalStudent3.id,
      studentId: "STU003",
      grade: "13",
      academicYear: "2024-2025",
      guardianName: "James Wilson",
      guardianPhone: "+94771111003",
      guardianEmail: "james.wilson@email.com",
      currentGPA: 3.9,
      totalCredits: 150,
      isExternal: false,
    },
  });
  console.log("✅ Internal Student 3 created:", internalStudent3.email);

  // ================================
  // EXTERNAL STUDENTS (2)
  // ================================
  const externalStudent1Password = await bcrypt.hash("Student123!@#", 12);
  const externalStudent1 = await prisma.user.upsert({
    where: { email: "student.external1@otherschool.com" },
    update: {},
    create: {
      email: "student.external1@otherschool.com",
      password: externalStudent1Password,
      firstName: "Diana",
      lastName: "Martinez",
      role: "EXTERNAL_STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234576",
      dateOfBirth: new Date("2007-06-18"),
      bio: "Exchange student from partner institution",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: externalStudent1.id },
    update: {},
    create: {
      userId: externalStudent1.id,
      studentId: "EXT_STU001",
      grade: "12",
      academicYear: "2024-2025",
      guardianName: "Maria Martinez",
      guardianPhone: "+94771111004",
      guardianEmail: "maria.martinez@email.com",
      currentGPA: 3.7,
      totalCredits: 110,
      isExternal: true,
      sourceInstitution: "Royal College",
    },
  });
  console.log("✅ External Student 1 created:", externalStudent1.email);

  const externalStudent2Password = await bcrypt.hash("Student123!@#", 12);
  const externalStudent2 = await prisma.user.upsert({
    where: { email: "student.external2@anotherSchool.com" },
    update: {},
    create: {
      email: "student.external2@anotherSchool.com",
      password: externalStudent2Password,
      firstName: "Ethan",
      lastName: "Taylor",
      role: "EXTERNAL_STUDENT",
      status: "ACTIVE",
      emailVerified: true,
      phone: "+94771234577",
      dateOfBirth: new Date("2007-10-30"),
      bio: "Transfer student seeking new opportunities",
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: externalStudent2.id },
    update: {},
    create: {
      userId: externalStudent2.id,
      studentId: "EXT_STU002",
      grade: "11",
      academicYear: "2024-2025",
      guardianName: "David Taylor",
      guardianPhone: "+94771111005",
      guardianEmail: "david.taylor@email.com",
      currentGPA: 3.5,
      totalCredits: 85,
      isExternal: true,
      sourceInstitution: "Colombo International School",
    },
  });
  console.log("✅ External Student 2 created:", externalStudent2.email);

  // ================================
  // SUBJECTS - Comprehensive Set
  // ================================
  console.log("\n📚 Creating subjects...");
  
  const subjects = [
    {
      code: "CS101",
      name: "Introduction to Programming",
      description: "Fundamentals of programming using Python and JavaScript",
      category: "STEM",
      medium: "ENGLISH",
      credits: 3,
      duration: 60,
      teacherId: internalTeacher1.id,
      imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea",
    },
    {
      code: "MATH201",
      name: "Advanced Mathematics",
      description: "Calculus, Linear Algebra, and Differential Equations",
      category: "STEM",
      medium: "ENGLISH",
      credits: 4,
      duration: 90,
      teacherId: internalTeacher2.id,
      imageUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
    },
    {
      code: "PHY301",
      name: "Physics - Mechanics",
      description: "Classical mechanics, motion, forces, and energy",
      category: "STEM",
      medium: "ENGLISH",
      credits: 4,
      duration: 90,
      teacherId: externalTeacher1.id,
      imageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa",
    },
    {
      code: "CHEM201",
      name: "Organic Chemistry",
      description: "Study of carbon compounds and chemical reactions",
      category: "STEM",
      medium: "ENGLISH",
      credits: 4,
      duration: 90,
      teacherId: externalTeacher2.id,
      imageUrl: "https://images.unsplash.com/photo-1532634922-8fe0b757fb13",
    },
    {
      code: "BIO101",
      name: "Biology Fundamentals",
      description: "Introduction to cellular biology and genetics",
      category: "STEM",
      medium: "ENGLISH",
      credits: 3,
      duration: 60,
      teacherId: internalTeacher2.id,
      imageUrl: "https://images.unsplash.com/photo-1530973428-5bf2db2e4d71",
    },
    {
      code: "ENG201",
      name: "English Literature",
      description: "Classic and contemporary literature analysis",
      category: "LANGUAGES",
      medium: "ENGLISH",
      credits: 3,
      duration: 60,
      teacherId: internalTeacher1.id,
      imageUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
    },
  ];

  for (const subject of subjects) {
    await prisma.subject.upsert({
      where: { code: subject.code },
      update: {},
      create: subject,
    });
  }
  console.log(`✅ ${subjects.length} subjects created`);

  // ================================
  // SAMPLE CLASSES
  // ================================
  const class1 = await prisma.class.upsert({
    where: { id: "class-programming-001" },
    update: {},
    create: {
      id: "class-programming-001",
      name: "Introduction to Python Programming",
      description:
        "Learn the fundamentals of Python programming from scratch. Perfect for beginners.",
      subject: "Computer Science",
      grade: "10",
      status: "ACTIVE",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-06-15"),
      schedule: JSON.stringify({
        days: ["Monday", "Wednesday", "Friday"],
        time: "10:00 AM",
        duration: 90,
      }),
      maxStudents: 40,
      isPublic: true,
      requiresApproval: false,
      teacherId: internalTeacher1.id,
    },
  });
  console.log("✅ Class 1 (Programming) created:", class1.name);

  const class2 = await prisma.class.upsert({
    where: { id: "class-calculus-001" },
    update: {},
    create: {
      id: "class-calculus-001",
      name: "Advanced Calculus",
      description:
        "Master differential and integral calculus with real-world applications.",
      subject: "Mathematics",
      grade: "12",
      status: "ACTIVE",
      startDate: new Date("2025-01-20"),
      endDate: new Date("2025-06-20"),
      schedule: JSON.stringify({
        days: ["Tuesday", "Thursday"],
        time: "2:00 PM",
        duration: 120,
      }),
      maxStudents: 35,
      isPublic: true,
      requiresApproval: false,
      teacherId: internalTeacher2.id,
    },
  });
  console.log("✅ Class 2 (Calculus) created:", class2.name);

  const class3 = await prisma.class.upsert({
    where: { id: "class-physics-001" },
    update: {},
    create: {
      id: "class-physics-001",
      name: "Quantum Physics Fundamentals",
      description:
        "Explore the fascinating world of quantum mechanics and modern physics.",
      subject: "Physics",
      grade: "13",
      status: "ACTIVE",
      startDate: new Date("2025-02-01"),
      endDate: new Date("2025-07-01"),
      schedule: JSON.stringify({
        days: ["Monday", "Thursday"],
        time: "11:00 AM",
        duration: 90,
      }),
      maxStudents: 30,
      isPublic: true,
      requiresApproval: true, // Requires approval for external teacher
      teacherId: externalTeacher1.id,
    },
  });
  console.log("✅ Class 3 (Physics) created:", class3.name);

  // ================================
  // ENROLLMENTS
  // ================================
  const enrollments = [
    {
      classId: class1.id,
      studentId: internalStudent1.id,
      status: "ACTIVE",
      isPaid: true,
    },
    {
      classId: class1.id,
      studentId: internalStudent2.id,
      status: "ACTIVE",
      isPaid: true,
    },
    {
      classId: class1.id,
      studentId: externalStudent1.id,
      status: "ACTIVE",
      isPaid: true,
    },

    {
      classId: class2.id,
      studentId: internalStudent1.id,
      status: "ACTIVE",
      isPaid: true,
    },
    {
      classId: class2.id,
      studentId: internalStudent3.id,
      status: "ACTIVE",
      isPaid: true,
    },
    {
      classId: class2.id,
      studentId: externalStudent2.id,
      status: "ACTIVE",
      isPaid: false,
    },

    {
      classId: class3.id,
      studentId: internalStudent3.id,
      status: "ACTIVE",
      isPaid: true,
    },
    {
      classId: class3.id,
      studentId: externalStudent1.id,
      status: "PENDING",
      isPaid: false,
    },
  ];

  for (const enrollment of enrollments) {
    await prisma.enrollment.upsert({
      where: {
        classId_studentId: {
          classId: enrollment.classId,
          studentId: enrollment.studentId,
        },
      },
      update: {},
      create: enrollment as any,
    });
  }
  console.log("✅ Student enrollments created");

  // ================================
  // WALLETS (for all users with initial balance)
  // ================================
  const walletsToCreate = [
    { userId: superAdmin.id, balance: 10000.0 },
    { userId: admin.id, balance: 5000.0 },
    { userId: internalTeacher1.id, balance: 2000.0 },
    { userId: internalTeacher2.id, balance: 2500.0 },
    { userId: externalTeacher1.id, balance: 1000.0 },
    { userId: externalTeacher2.id, balance: 1200.0 },
    { userId: internalStudent1.id, balance: 500.0 },
    { userId: internalStudent2.id, balance: 300.0 },
    { userId: internalStudent3.id, balance: 750.0 },
    { userId: externalStudent1.id, balance: 200.0 },
    { userId: externalStudent2.id, balance: 150.0 },
  ];

  for (const wallet of walletsToCreate) {
    await prisma.wallet.upsert({
      where: { userId: wallet.userId },
      update: {},
      create: wallet,
    });
  }
  console.log("✅ User wallets created with initial balance");

  // ================================
  // ATTENDANCE RECORDS
  // ================================
  console.log("\n📋 Creating attendance records...");
  
  const attendanceRecords = [
    // Class 1 (Programming) - Multiple sessions
    { userId: internalStudent1.id, classId: class1.id, date: new Date("2025-01-15"), present: true, type: "CLASS", markedBy: internalTeacher1.id },
    { userId: internalStudent2.id, classId: class1.id, date: new Date("2025-01-15"), present: true, type: "CLASS", markedBy: internalTeacher1.id },
    { userId: externalStudent1.id, classId: class1.id, date: new Date("2025-01-15"), present: true, type: "CLASS", markedBy: internalTeacher1.id },
    
    { userId: internalStudent1.id, classId: class1.id, date: new Date("2025-01-18"), present: true, type: "CLASS", markedBy: internalTeacher1.id },
    { userId: internalStudent2.id, classId: class1.id, date: new Date("2025-01-18"), present: false, type: "CLASS", markedBy: internalTeacher1.id },
    { userId: externalStudent1.id, classId: class1.id, date: new Date("2025-01-18"), present: true, type: "CLASS", markedBy: internalTeacher1.id },
    
    // Class 2 (Calculus)
    { userId: internalStudent1.id, classId: class2.id, date: new Date("2025-01-16"), present: true, type: "CLASS", markedBy: internalTeacher2.id },
    { userId: internalStudent3.id, classId: class2.id, date: new Date("2025-01-16"), present: true, type: "CLASS", markedBy: internalTeacher2.id },
    { userId: externalStudent2.id, classId: class2.id, date: new Date("2025-01-16"), present: true, type: "CLASS", markedBy: internalTeacher2.id },
    
    { userId: internalStudent1.id, classId: class2.id, date: new Date("2025-01-19"), present: true, type: "CLASS", markedBy: internalTeacher2.id },
    { userId: internalStudent3.id, classId: class2.id, date: new Date("2025-01-19"), present: true, type: "CLASS", markedBy: internalTeacher2.id },
    { userId: externalStudent2.id, classId: class2.id, date: new Date("2025-01-19"), present: false, type: "CLASS", markedBy: internalTeacher2.id },
    
    // Class 3 (Physics)
    { userId: internalStudent3.id, classId: class3.id, date: new Date("2025-01-17"), present: true, type: "CLASS", markedBy: externalTeacher1.id },
    { userId: externalStudent1.id, classId: class3.id, date: new Date("2025-01-17"), present: true, type: "CLASS", markedBy: externalTeacher1.id },
    
    { userId: internalStudent3.id, classId: class3.id, date: new Date("2025-01-20"), present: true, type: "CLASS", markedBy: externalTeacher1.id },
    { userId: externalStudent1.id, classId: class3.id, date: new Date("2025-01-20"), present: true, type: "CLASS", markedBy: externalTeacher1.id },
  ];

  for (const attendance of attendanceRecords) {
    await prisma.attendance.create({
      data: attendance as any,
    });
  }
  console.log(`✅ ${attendanceRecords.length} attendance records created`);

  // ================================
  // PUBLICATIONS (Educational Resources)
  // ================================
  console.log("\n📚 Creating publications...");
  
  const publication1 = await prisma.publication.create({
    data: {
      title: "Python Programming Complete Guide",
      description: "Comprehensive guide covering Python from basics to advanced topics with 200+ examples",
      price: 1500.0,
      fileUrl: "https://example.com/python-guide.pdf",
      coverImage: "https://images.unsplash.com/photo-1526379095098-d400fd0bf935",
      status: "PUBLISHED",
      createdById: internalTeacher1.id,
      grade: ["11", "12"],
      subject: ["Programming", "Computer Science"],
      medium: "ENGLISH",
      publishedAt: new Date("2025-01-10"),
    },
  });

  const publication2 = await prisma.publication.create({
    data: {
      title: "Advanced Calculus Notes",
      description: "Detailed notes on differential and integral calculus with solved problems",
      price: 800.0,
      fileUrl: "https://example.com/calculus-notes.pdf",
      coverImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb",
      status: "PUBLISHED",
      createdById: internalTeacher2.id,
      grade: ["12", "13"],
      subject: ["Mathematics", "Calculus"],
      medium: "ENGLISH",
      publishedAt: new Date("2025-01-12"),
    },
  });

  const publication3 = await prisma.publication.create({
    data: {
      title: "Physics Problem Solver",
      description: "Collection of 500+ physics problems with detailed solutions",
      price: 2000.0,
      fileUrl: "https://example.com/physics-problems.pdf",
      coverImage: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa",
      status: "PUBLISHED",
      createdById: externalTeacher1.id,
      grade: ["12", "13"],
      subject: ["Physics", "Mechanics"],
      medium: "ENGLISH",
      publishedAt: new Date("2025-01-08"),
    },
  });

  console.log("✅ 3 publications created");

  // ================================
  // PUBLICATION PURCHASES & REVIEWS
  // ================================
  console.log("\n💰 Creating publication purchases and reviews...");
  
  // Purchases
  const purchases = [
    { publicationId: publication1.id, userId: internalStudent1.id, amount: 1500.0 },
    { publicationId: publication1.id, userId: internalStudent2.id, amount: 1500.0 },
    { publicationId: publication2.id, userId: internalStudent1.id, amount: 800.0 },
    { publicationId: publication3.id, userId: internalStudent3.id, amount: 2000.0 },
  ];

  for (const purchase of purchases) {
    await prisma.publicationPurchase.create({
      data: purchase,
    });
  }
  console.log(`✅ ${purchases.length} purchases created`);

  // Reviews
  const reviews = [
    { publicationId: publication1.id, userId: internalStudent1.id, rating: 5, comment: "Excellent guide! Very comprehensive and easy to follow." },
    { publicationId: publication1.id, userId: internalStudent2.id, rating: 4, comment: "Great resource, helped me understand Python concepts better." },
    { publicationId: publication2.id, userId: internalStudent1.id, rating: 5, comment: "Best calculus notes I've found. Clear explanations!" },
    { publicationId: publication3.id, userId: internalStudent3.id, rating: 5, comment: "Amazing problem set with detailed solutions." },
  ];

  for (const review of reviews) {
    await prisma.publicationReview.create({
      data: review,
    });
  }
  console.log(`✅ ${reviews.length} reviews created`);

  // ================================
  // VIDEO SESSIONS
  // ================================
  console.log("\n🎥 Creating video sessions...");
  
  const videoSession1 = await prisma.videoSession.create({
    data: {
      title: "Introduction to Python - Live Session",
      classId: class1.id,
      hostId: internalTeacher1.id,
      scheduledStartTime: new Date("2025-01-22T10:00:00Z"),
      durationMinutes: 90,
      status: "ENDED",
      recordingUrl: "https://example.com/recordings/python-intro-session1.mp4",
      jitsiRoomName: "learnup-python-session-001",
      startedAt: new Date("2025-01-22T10:02:00Z"),
      endedAt: new Date("2025-01-22T11:32:00Z"),
      actualDuration: 90,
    },
  });

  const videoSession2 = await prisma.videoSession.create({
    data: {
      title: "Calculus Problem Solving Workshop",
      classId: class2.id,
      hostId: internalTeacher2.id,
      scheduledStartTime: new Date("2025-01-23T14:00:00Z"),
      durationMinutes: 120,
      status: "ENDED",
      recordingUrl: "https://example.com/recordings/calculus-workshop1.mp4",
      jitsiRoomName: "learnup-calculus-session-001",
      startedAt: new Date("2025-01-23T14:00:00Z"),
      endedAt: new Date("2025-01-23T16:00:00Z"),
      actualDuration: 120,
    },
  });

  const videoSession3 = await prisma.videoSession.create({
    data: {
      title: "Physics Lab Demonstration",
      classId: class3.id,
      hostId: externalTeacher1.id,
      scheduledStartTime: new Date("2025-01-24T11:00:00Z"),
      durationMinutes: 60,
      status: "SCHEDULED",
      jitsiRoomName: "learnup-physics-session-001",
    },
  });

  console.log("✅ 3 video sessions created");

  // ================================
  // VIDEO SESSION PARTICIPANTS
  // ================================
  const sessionParticipants = [
    // Session 1 participants
    { sessionId: videoSession1.id, userId: internalStudent1.id, joinedAt: new Date("2025-01-22T10:02:00Z"), leftAt: new Date("2025-01-22T11:30:00Z"), duration: 88 },
    { sessionId: videoSession1.id, userId: internalStudent2.id, joinedAt: new Date("2025-01-22T10:05:00Z"), leftAt: new Date("2025-01-22T11:28:00Z"), duration: 83 },
    { sessionId: videoSession1.id, userId: externalStudent1.id, joinedAt: new Date("2025-01-22T10:15:00Z"), leftAt: new Date("2025-01-22T11:30:00Z"), duration: 75 },
    
    // Session 2 participants
    { sessionId: videoSession2.id, userId: internalStudent1.id, joinedAt: new Date("2025-01-23T14:00:00Z"), leftAt: new Date("2025-01-23T16:00:00Z"), duration: 120 },
    { sessionId: videoSession2.id, userId: internalStudent3.id, joinedAt: new Date("2025-01-23T14:03:00Z"), leftAt: new Date("2025-01-23T15:58:00Z"), duration: 115 },
  ];

  for (const participant of sessionParticipants) {
    await prisma.sessionParticipant.create({
      data: participant as any,
    });
  }
  console.log(`✅ ${sessionParticipants.length} session participants created`);

  // ================================
  // TRANSFER REQUESTS
  // ================================
  console.log("\n💸 Creating transfer requests...");
  
  const transfer1 = await prisma.transferRequest.create({
    data: {
      uniqueId: "TR2025001",
      requesterId: internalTeacher1.id,
      registrationId: "TR12345",
      currentSchool: "Ananda College",
      currentDistrict: "Colombo",
      currentZone: "Colombo North",
      fromZone: "Colombo North",
      toZones: ["Gampaha", "Colombo South"],
      subject: "Mathematics",
      medium: "ENGLISH",
      level: "A/L",
      status: "VERIFIED",
      verified: true,
      verifiedBy: admin.id,
      verifiedAt: new Date("2025-01-18T10:00:00Z"),
    },
  });

  const transfer2 = await prisma.transferRequest.create({
    data: {
      uniqueId: "TR2025002",
      requesterId: externalTeacher1.id,
      registrationId: "TR54321",
      currentSchool: "Royal College",
      currentDistrict: "Gampaha",
      currentZone: "Gampaha",
      fromZone: "Gampaha",
      toZones: ["Colombo North", "Colombo Central"],
      subject: "Physics",
      medium: "ENGLISH",
      level: "A/L",
      status: "PENDING",
      verified: false,
    },
  });

  const transfer3 = await prisma.transferRequest.create({
    data: {
      uniqueId: "TR2025003",
      requesterId: externalTeacher2.id,
      registrationId: "TR98765",
      currentSchool: "Colombo International School",
      currentDistrict: "Colombo",
      currentZone: "Colombo South",
      fromZone: "Colombo South",
      toZones: ["Colombo North"],
      subject: "Chemistry",
      medium: "ENGLISH",
      level: "A/L",
      status: "ACCEPTED",
      verified: true,
      verifiedBy: admin.id,
      verifiedAt: new Date("2025-01-19T11:00:00Z"),
      receiverId: internalTeacher2.id,
    },
  });

  console.log("✅ 3 transfer requests created");

  // ================================
  // TRANSFER MESSAGES
  // ================================
  const transferMessages = [
    { transferRequestId: transfer1.id, senderId: admin.id, content: "Your documents have been verified. Transfer request looks good." },
    { transferRequestId: transfer1.id, senderId: internalTeacher1.id, content: "Thank you! When will it be processed?" },
    { transferRequestId: transfer1.id, senderId: admin.id, content: "Should be matched within 2-3 weeks." },
    
    { transferRequestId: transfer3.id, senderId: admin.id, content: "Documents verified successfully." },
    { transferRequestId: transfer3.id, senderId: externalTeacher2.id, content: "Great! Looking forward to the transfer." },
  ];

  for (const message of transferMessages) {
    await prisma.transferMessage.create({
      data: message,
    });
  }
  console.log(`✅ ${transferMessages.length} transfer messages created`);

  // ================================
  // TIMETABLE ENTRIES
  // ================================
  console.log("\n📅 Creating timetable entries...");
  
  const timetableEntries = [
    // Monday
    { 
      grade: "11", 
      subject: "Programming", 
      teacherId: internalTeacher1.id, 
      classLink: "https://meet.jit.si/learnup-prog-mon",
      classId: class1.id,
      dayOfWeek: 1, 
      startTime: "09:00", 
      endTime: "10:30",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    { 
      grade: "12", 
      subject: "Calculus", 
      teacherId: internalTeacher2.id, 
      classLink: "https://meet.jit.si/learnup-calc-mon",
      classId: class2.id,
      dayOfWeek: 1, 
      startTime: "14:00", 
      endTime: "16:00",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    
    // Tuesday
    { 
      grade: "13", 
      subject: "Physics", 
      teacherId: externalTeacher1.id, 
      classLink: "https://meet.jit.si/learnup-phy-tue",
      classId: class3.id,
      dayOfWeek: 2, 
      startTime: "11:00", 
      endTime: "12:30",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    
    // Wednesday
    { 
      grade: "11", 
      subject: "Programming", 
      teacherId: internalTeacher1.id, 
      classLink: "https://meet.jit.si/learnup-prog-wed",
      classId: class1.id,
      dayOfWeek: 3, 
      startTime: "09:00", 
      endTime: "10:30",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    { 
      grade: "12", 
      subject: "Calculus", 
      teacherId: internalTeacher2.id, 
      classLink: "https://meet.jit.si/learnup-calc-wed",
      classId: class2.id,
      dayOfWeek: 3, 
      startTime: "14:00", 
      endTime: "16:00",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    
    // Thursday
    { 
      grade: "13", 
      subject: "Physics", 
      teacherId: externalTeacher1.id, 
      classLink: "https://meet.jit.si/learnup-phy-thu",
      classId: class3.id,
      dayOfWeek: 4, 
      startTime: "11:00", 
      endTime: "12:30",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
    
    // Friday
    { 
      grade: "12", 
      subject: "Calculus", 
      teacherId: internalTeacher2.id, 
      classLink: "https://meet.jit.si/learnup-calc-fri",
      classId: class2.id,
      dayOfWeek: 5, 
      startTime: "10:00", 
      endTime: "12:00",
      validFrom: new Date("2025-01-01"),
      validUntil: new Date("2025-12-31"),
    },
  ];

  for (const entry of timetableEntries) {
    await prisma.timetable.create({
      data: entry,
    });
  }
  console.log(`✅ ${timetableEntries.length} timetable entries created`);

  // ================================
  // PAYMENT TRANSACTIONS
  // ================================
  console.log("\n💳 Creating payment transactions...");
  
  const transactions = [
    { 
      userId: internalStudent1.id, 
      amount: 500.0, 
      method: "BANK_SLIP",
      description: "Bank transfer deposit", 
      status: "COMPLETED",
      bankSlipUrl: "https://example.com/slips/slip001.jpg",
      bankSlipVerifiedBy: admin.id,
      bankSlipVerifiedAt: new Date("2025-01-10"),
      processedAt: new Date("2025-01-10"),
    },
    { 
      userId: internalStudent1.id, 
      amount: 1500.0, 
      method: "WALLET_CREDITS",
      description: "Purchase: Python Programming Complete Guide", 
      status: "COMPLETED",
      referenceType: "PUBLICATION",
      referenceId: publication1.id,
      processedAt: new Date("2025-01-15"),
    },
    { 
      userId: internalStudent2.id, 
      amount: 1500.0, 
      method: "WALLET_CREDITS",
      description: "Purchase: Python Programming Complete Guide", 
      status: "COMPLETED",
      referenceType: "PUBLICATION",
      referenceId: publication1.id,
      processedAt: new Date("2025-01-16"),
    },
    { 
      userId: internalStudent3.id, 
      amount: 2000.0, 
      method: "WALLET_CREDITS",
      description: "Purchase: Physics Problem Solver", 
      status: "COMPLETED",
      referenceType: "PUBLICATION",
      referenceId: publication3.id,
      processedAt: new Date("2025-01-17"),
    },
  ];

  for (const transaction of transactions) {
    await prisma.payment.create({
      data: transaction as any,
    });
  }
  console.log(`✅ ${transactions.length} payment transactions created`);

  // ================================
  // SAMPLE EXAMS
  // ================================
  const exam1 = await prisma.exam.upsert({
    where: { id: "exam-python-basics-001" },
    update: {},
    create: {
      id: "exam-python-basics-001",
      title: "Python Basics Assessment",
      description:
        "Test your understanding of Python fundamentals including variables, data types, and control structures.",
      type: "MULTIPLE_CHOICE",
      status: "PUBLISHED",
      duration: 60,
      totalMarks: 100,
      passingMarks: 60,
      attemptsAllowed: 2,
      aiMonitoringEnabled: true,
      faceVerificationRequired: true,
      startTime: new Date("2025-03-01T09:00:00Z"),
      endTime: new Date("2025-03-01T18:00:00Z"),
      classId: class1.id,
      instructions:
        "Read each question carefully. You have 60 minutes to complete this exam. AI monitoring is enabled.",
    },
  });

  const exam2 = await prisma.exam.upsert({
    where: { id: "exam-calculus-midterm-001" },
    update: {},
    create: {
      id: "exam-calculus-midterm-001",
      title: "Calculus Midterm Examination",
      description:
        "Comprehensive midterm covering differentiation, integration, and applications.",
      type: "MIXED",
      status: "PUBLISHED",
      duration: 120,
      totalMarks: 150,
      passingMarks: 75,
      attemptsAllowed: 1,
      aiMonitoringEnabled: true,
      faceVerificationRequired: true,
      startTime: new Date("2025-03-15T10:00:00Z"),
      endTime: new Date("2025-03-15T16:00:00Z"),
      classId: class2.id,
      instructions:
        "Show all work. Calculators are allowed. AI proctoring is active.",
    },
  });
  console.log("✅ Sample exams created");

  // ================================
  // EXAM QUESTIONS
  // ================================
  const pythonQuestions = [
    {
      examId: exam1.id,
      type: "MULTIPLE_CHOICE",
      question: "What is the correct way to create a variable in Python?",
      options: JSON.stringify([
        "var x = 5",
        "x = 5",
        "int x = 5",
        "create x = 5",
      ]),
      correctAnswer: "x = 5",
      points: 10,
      order: 1,
    },
    {
      examId: exam1.id,
      type: "MULTIPLE_CHOICE",
      question: "Which of the following is a mutable data type in Python?",
      options: JSON.stringify(["tuple", "string", "list", "int"]),
      correctAnswer: "list",
      points: 10,
      order: 2,
    },
    {
      examId: exam1.id,
      type: "TRUE_FALSE",
      question: "Python is case-sensitive.",
      options: JSON.stringify(["True", "False"]),
      correctAnswer: "True",
      points: 5,
      order: 3,
    },
    {
      examId: exam1.id,
      type: "MULTIPLE_CHOICE",
      question: "What does the len() function do?",
      options: JSON.stringify([
        "Calculates length",
        "Returns size of object",
        "Counts elements",
        "All of the above",
      ]),
      correctAnswer: "All of the above",
      points: 10,
      order: 4,
    },
    {
      examId: exam1.id,
      type: "SHORT_ANSWER",
      question: 'Write a Python statement to print "Hello, World!"',
      correctAnswer: 'print("Hello, World!")',
      points: 15,
      order: 5,
    },
  ];

  for (const question of pythonQuestions) {
    await prisma.examQuestion.create({
      data: question as any,
    });
  }
  console.log("✅ Exam questions created");

  // ================================
  // SYSTEM CONFIGURATION
  // ================================
  const systemConfigs = [
    {
      key: "MAX_FILE_UPLOAD_SIZE",
      value: "10485760",
      description: "Maximum file upload size in bytes (10MB)",
    },
    {
      key: "DEFAULT_EXAM_DURATION",
      value: "60",
      description: "Default exam duration in minutes",
    },
    {
      key: "AI_MONITORING_ENABLED",
      value: "true",
      description: "Global AI monitoring availability",
    },
    {
      key: "FACE_VERIFICATION_ENABLED",
      value: "true",
      description: "Enable face verification for exams",
    },
    {
      key: "PAYMENT_GATEWAY_ENABLED",
      value: "true",
      description: "Enable payment gateway integration",
    },
    {
      key: "MIN_PASSWORD_LENGTH",
      value: "8",
      description: "Minimum password length",
    },
    {
      key: "SESSION_TIMEOUT_MINUTES",
      value: "60",
      description: "User session timeout in minutes",
    },
    {
      key: "MAX_LOGIN_ATTEMPTS",
      value: "5",
      description: "Maximum failed login attempts before lockout",
    },
    {
      key: "WALLET_MIN_BALANCE",
      value: "0",
      description: "Minimum wallet balance allowed",
    },
    {
      key: "WALLET_MAX_TRANSACTION",
      value: "10000",
      description: "Maximum single transaction amount",
    },
  ];

  for (const config of systemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: config,
    });
  }
  console.log("✅ System configuration created");

  console.log("\n🎉 Database seeding completed successfully!");
  console.log("\n" + "=".repeat(70));
  console.log("📋 TEST ACCOUNTS SUMMARY");
  console.log("=".repeat(70));
  console.log("\n👑 SUPER ADMIN:");
  console.log("   Email: superadmin@learnup.com");
  console.log("   Password: SuperAdmin123!@#");
  console.log("\n🔧 ADMIN:");
  console.log("   Email: admin@learnup.com");
  console.log("   Password: Admin123!@#");
  console.log("\n👨‍🏫 INTERNAL TEACHERS:");
  console.log(
    "   1. teacher.internal1@learnup.com / Teacher123!@# (Computer Science)"
  );
  console.log(
    "   2. teacher.internal2@learnup.com / Teacher123!@# (Mathematics)"
  );
  console.log("\n👨‍🏫 EXTERNAL TEACHERS:");
  console.log(
    "   1. teacher.external1@otherschool.com / Teacher123!@# (Physics)"
  );
  console.log(
    "   2. teacher.external2@anotherSchool.com / Teacher123!@# (Chemistry)"
  );
  console.log("\n👨‍🎓 INTERNAL STUDENTS:");
  console.log("   1. student.internal1@learnup.com / Student123!@# (Grade 12)");
  console.log("   2. student.internal2@learnup.com / Student123!@# (Grade 11)");
  console.log("   3. student.internal3@learnup.com / Student123!@# (Grade 13)");
  console.log("\n👨‍🎓 EXTERNAL STUDENTS:");
  console.log(
    "   1. student.external1@otherschool.com / Student123!@# (Grade 12)"
  );
  console.log(
    "   2. student.external2@anotherSchool.com / Student123!@# (Grade 11)"
  );
  console.log("\n" + "=".repeat(70));
  console.log("📊 SEEDED DATA:");
  console.log("   • 11 Users (1 Super Admin, 1 Admin, 4 Teachers, 5 Students)");
  console.log("   • 3 Classes (Programming, Calculus, Physics)");
  console.log("   • 8 Enrollments");
  console.log("   • 11 Wallets with initial balance");
  console.log("   • 2 Exams with questions");
  console.log("   • 10 System configurations");
  console.log("=".repeat(70) + "\n");
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:');
    console.error(e);
    (process as any).exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });