import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@database/prisma.service";
import { UserRole } from "@prisma/client";

/** Generate student registration numbers: INSTITUTION_CODE/STUDENT_TYPE/AL_BATCH_YEAR/SEQUENCE (e.g., PV/IN/2019/001). */
@Injectable()
export class RegistrationNumberService {
  private readonly logger = new Logger(RegistrationNumberService.name);
  private readonly DEFAULT_INSTITUTION_CODE = "PV"; // Default institution code

  constructor(private prisma: PrismaService) {}

  /** Calculate A/L batch year from grade level (Grade 10→+4, 11→+3, 12→+2, 13→+1). */
  calculateALBatchYear(gradeLevel: number, currentYear?: number): number {
    const year = currentYear || new Date().getFullYear();
    const alYear = year + (13 - gradeLevel) + 1;
    return alYear;
  }

  /**
   * Get grade level from grade ID
   * @param gradeId - The grade ID from the database
   * @returns The numeric grade level
   */
  async getGradeLevelFromId(gradeId: string): Promise<number | null> {
    const grade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
      select: { level: true, name: true },
    });

    if (!grade) {
      this.logger.warn(`Grade not found for ID: ${gradeId}`);
      return null;
    }

    // Use the level field directly if available
    if (grade.level !== null && grade.level !== undefined) {
      return grade.level;
    }

    // Fallback: Parse grade name (e.g., "Grade 10", "10")
    const match = grade.name.match(/(\d+)/);
    if (match) {
      return parseInt(match[1], 10);
    }

    this.logger.warn(
      `Could not determine grade level from name: ${grade.name}`
    );
    return null;
  }

  /**
   * Get student type code based on role
   * @param role - The user role
   * @returns "IN" for internal students, "EX" for external students
   */
  getStudentTypeCode(role: UserRole): string {
    return role === UserRole.INTERNAL_STUDENT ? "IN" : "EX";
  }

  /**
   * Get institution code
   * For now, uses default institution code
   * In future, this can be fetched from institution settings or user's institution
   *
   * @param institutionId - Optional institution ID
   * @returns The institution code
   */
  async getInstitutionCode(institutionId?: string): Promise<string> {
    if (institutionId) {
      const institution = await this.prisma.institution.findUnique({
        where: { id: institutionId },
        select: { code: true },
      });
      if (institution?.code) {
        return institution.code;
      }
    }

    // Return default institution code
    return this.DEFAULT_INSTITUTION_CODE;
  }

  /**
   * Get the next sequence number for a given batch
   * @param institutionCode - The institution code
   * @param studentType - "IN" or "EX"
   * @param alBatchYear - The A/L batch year
   * @returns The next available sequence number
   */
  async getNextSequenceNumber(
    institutionCode: string,
    studentType: string,
    alBatchYear: number
  ): Promise<number> {
    // Build the pattern to search for: "PV/IN/2019/"
    const prefix = `${institutionCode}/${studentType}/${alBatchYear}/`;

    // Find all student IDs that match this pattern
    const existingStudents = await this.prisma.studentProfile.findMany({
      where: {
        studentId: {
          startsWith: prefix,
        },
      },
      select: {
        studentId: true,
      },
      orderBy: {
        studentId: "desc",
      },
    });

    if (existingStudents.length === 0) {
      return 1;
    }

    // Extract the sequence numbers and find the max
    let maxSequence = 0;
    for (const student of existingStudents) {
      if (student.studentId) {
        // Extract the sequence number from the end (e.g., "PV/IN/2019/001" → "001" → 1)
        const parts = student.studentId.split("/");
        if (parts.length === 4) {
          const sequenceStr = parts[3];
          const sequence = parseInt(sequenceStr, 10);
          if (!isNaN(sequence) && sequence > maxSequence) {
            maxSequence = sequence;
          }
        }
      }
    }

    return maxSequence + 1;
  }

  /**
   * Format sequence number with leading zeros
   * @param sequence - The sequence number
   * @param digits - Number of digits (default: 3)
   * @returns Formatted sequence (e.g., "001", "042", "999")
   */
  formatSequenceNumber(sequence: number, digits: number = 3): string {
    return sequence.toString().padStart(digits, "0");
  }

  /**
   * Generate a complete registration number for a student
   *
   * @param role - The user role (INTERNAL_STUDENT or EXTERNAL_STUDENT)
   * @param gradeId - The grade ID (optional - if not provided, will use current year as A/L batch)
   * @param institutionId - The institution ID (optional - uses default if not provided)
   * @param currentYear - The current year (optional - defaults to calendar year)
   * @returns The generated registration number (e.g., "PV/IN/2019/001")
   */
  async generateRegistrationNumber(
    role: UserRole,
    gradeId?: string,
    institutionId?: string,
    currentYear?: number
  ): Promise<string> {
    const year = currentYear || new Date().getFullYear();

    // Get institution code
    const institutionCode = await this.getInstitutionCode(institutionId);

    // Get student type
    const studentType = this.getStudentTypeCode(role);

    // Calculate A/L batch year
    let alBatchYear: number;
    if (gradeId) {
      const gradeLevel = await this.getGradeLevelFromId(gradeId);
      if (gradeLevel !== null && gradeLevel >= 6 && gradeLevel <= 13) {
        alBatchYear = this.calculateALBatchYear(gradeLevel, year);
      } else {
        // Default to current year + 3 if grade level is unknown
        this.logger.warn(
          `Invalid or unknown grade level, using default A/L batch calculation`
        );
        alBatchYear = year + 3;
      }
    } else {
      // If no grade provided, assume Grade 10 (A/L in 3 years)
      alBatchYear = year + 3;
    }

    // Get next sequence number
    const sequence = await this.getNextSequenceNumber(
      institutionCode,
      studentType,
      alBatchYear
    );

    // Format the registration number
    const formattedSequence = this.formatSequenceNumber(sequence);
    const registrationNumber = `${institutionCode}/${studentType}/${alBatchYear}/${formattedSequence}`;

    this.logger.log(
      `Generated registration number: ${registrationNumber} (Grade ID: ${gradeId}, Role: ${role})`
    );

    return registrationNumber;
  }

  /**
   * Parse a registration number to extract its components
   * @param registrationNumber - The registration number to parse
   * @returns The parsed components or null if invalid format
   */
  parseRegistrationNumber(registrationNumber: string): {
    institutionCode: string;
    studentType: string;
    alBatchYear: number;
    sequence: number;
  } | null {
    const parts = registrationNumber.split("/");
    if (parts.length !== 4) {
      return null;
    }

    const [institutionCode, studentType, alBatchYearStr, sequenceStr] = parts;
    const alBatchYear = parseInt(alBatchYearStr, 10);
    const sequence = parseInt(sequenceStr, 10);

    if (isNaN(alBatchYear) || isNaN(sequence)) {
      return null;
    }

    return {
      institutionCode,
      studentType,
      alBatchYear,
      sequence,
    };
  }

  /**
   * Validate a registration number format
   * @param registrationNumber - The registration number to validate
   * @returns true if valid, false otherwise
   */
  isValidRegistrationNumber(registrationNumber: string): boolean {
    const pattern = /^[A-Z]{2,5}\/(IN|EX)\/\d{4}\/\d{3,}$/;
    return pattern.test(registrationNumber);
  }

  /**
   * Update a student's registration number if they change grade
   * This recalculates the A/L batch year based on the new grade
   *
   * @param userId - The user ID
   * @param newGradeId - The new grade ID
   * @returns The updated registration number
   */
  async updateRegistrationNumberForGradeChange(
    userId: string,
    newGradeId: string
  ): Promise<string | null> {
    // Get current student profile
    const studentProfile = await this.prisma.studentProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: { role: true },
        },
      },
    });

    if (!studentProfile || !studentProfile.user) {
      this.logger.warn(`Student profile not found for user: ${userId}`);
      return null;
    }

    // Parse current registration number to preserve sequence if possible
    const currentRegNum = studentProfile.studentId;
    let currentSequence: number | null = null;

    if (currentRegNum) {
      const parsed = this.parseRegistrationNumber(currentRegNum);
      if (parsed) {
        currentSequence = parsed.sequence;
      }
    }

    // Generate new registration number
    const newRegistrationNumber = await this.generateRegistrationNumber(
      studentProfile.user.role,
      newGradeId
    );

    return newRegistrationNumber;
  }
}
