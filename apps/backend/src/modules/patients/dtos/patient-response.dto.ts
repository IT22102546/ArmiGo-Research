import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email?: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  dateOfBirth: string;

  @ApiProperty()
  age: number;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  bloodType?: string;

  @ApiProperty()
  ward?: string;

  @ApiProperty()
  diagnosis?: string;

  @ApiProperty()
  assignedDoctor?: string;

  @ApiProperty()
  medicalHistory?: string;

  @ApiProperty()
  emergencyContact?: string;

  @ApiProperty()
  emergencyPhone?: string;

  @ApiProperty()
  hospitalId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  enrolledAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class PatientStatsDto {
  @ApiProperty()
  totalPatients: number;

  @ApiProperty()
  activePatients: number;

  @ApiProperty()
  inactivePatients: number;

  @ApiProperty()
  newPatientsThisMonth: number;

  @ApiProperty()
  newPatientsThisWeek: number;

  @ApiProperty()
  averageAge: number;

  @ApiProperty()
  byGender: Record<string, number>;

  @ApiProperty()
  byDiagnosis: Record<string, number>;

  @ApiProperty()
  byWard: Record<string, number>;
}
