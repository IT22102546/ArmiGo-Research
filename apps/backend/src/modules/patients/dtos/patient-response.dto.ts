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

  @ApiProperty({ description: 'Main hospital ID' })
  hospitalId?: string;

  @ApiProperty({ description: 'Hospital name and details' })
  hospital?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    districtId?: string;
    zoneId?: string;
  };

  @ApiProperty({ description: 'SubHospital/Clinic if applicable' })
  subHospitalId?: string;

  @ApiProperty({ description: 'SubHospital/Clinic details' })
  subHospital?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    type?: string;
  };

  @ApiProperty({ description: 'District information' })
  district?: {
    id: string;
    name: string;
    code?: string;
  };

  @ApiProperty({ description: 'Zone information' })
  zone?: {
    id: string;
    name: string;
    code?: string;
  };

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
