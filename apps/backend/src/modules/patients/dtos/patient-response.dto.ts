import { ApiProperty } from '@nestjs/swagger';

export class PatientResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Human-readable shareable ID' })
  displayId?: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  parentName?: string;

  @ApiProperty({ required: false })
  parentEmail?: string;

  @ApiProperty({ required: false })
  parentPhone?: string;

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

  @ApiProperty({ required: false })
  address?: string;

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

  @ApiProperty({ description: 'Province information' })
  province?: {
    id: string;
    name: string;
    code?: string;
  };

  // Exercise type selections
  @ApiProperty({ required: false, description: 'Whether child does finger exercises' })
  exerciseFingers?: boolean;

  @ApiProperty({ required: false, description: 'Whether child does wrist exercises' })
  exerciseWrist?: boolean;

  @ApiProperty({ required: false, description: 'Whether child does elbow exercises' })
  exerciseElbow?: boolean;

  @ApiProperty({ required: false, description: 'Whether child does shoulder exercises' })
  exerciseShoulder?: boolean;

  @ApiProperty({
    required: false,
    description:
      'Computed tracker summary for child progress and gameplay engagement',
  })
  progressTracker?: {
    startProgress: number;
    currentProgress: number;
    playTimeMinutes: number;
    playedDays: number;
    fingerProgress?: number;
    wristProgress?: number;
    elbowProgress?: number;
    shoulderProgress?: number;
  };

  @ApiProperty({
    required: false,
    description: 'Parent credentials to hand over after child registration',
  })
  parentCredentials?: {
    email: string;
    phone: string;
    password: string;
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
