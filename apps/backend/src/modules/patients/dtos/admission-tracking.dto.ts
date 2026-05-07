import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAdmissionTrackingDto {
  @ApiProperty({ example: 'cmchildid123' })
  @IsString()
  @IsNotEmpty()
  childId: string;

  @ApiPropertyOptional({ example: 'cmphysioid123' })
  @IsOptional()
  @IsString()
  physiotherapistId?: string;

  @ApiPropertyOptional({ example: 'cmhospitalid123' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'cmdeviceid123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'REHAB' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ example: '2026-03-02' })
  @IsDateString()
  admissionDate: string;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '10:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: '2026-03-30' })
  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @ApiPropertyOptional({ example: '2026-03-03' })
  @IsOptional()
  @IsDateString()
  deviceAssignedDate?: string;

  @ApiPropertyOptional({ example: 'Pediatric Neuro Rehab' })
  @IsOptional()
  @IsString()
  clinic?: string;

  @ApiPropertyOptional({ example: 'Ward A - Bed 5' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ example: 'Needs weekly progress review' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'ArmiGo Glove Unit' })
  @IsOptional()
  @IsString()
  manualDeviceName?: string;

  @ApiPropertyOptional({ example: 'Wearable' })
  @IsOptional()
  @IsString()
  manualDeviceType?: string;

  @ApiPropertyOptional({ example: 'AG-2026-001' })
  @IsOptional()
  @IsString()
  manualDeviceSerial?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/pdf/plan.pdf' })
  @IsOptional()
  @IsString()
  treatmentPlanPdf?: string;
}

export class UpdateAdmissionTrackingDto {
  @ApiPropertyOptional({ example: 'cmchildid123' })
  @IsOptional()
  @IsString()
  childId?: string;

  @ApiPropertyOptional({ example: 'cmphysioid123' })
  @IsOptional()
  @IsString()
  physiotherapistId?: string;

  @ApiPropertyOptional({ example: 'cmhospitalid123' })
  @IsOptional()
  @IsString()
  hospitalId?: string;

  @ApiPropertyOptional({ example: 'cmdeviceid123' })
  @IsOptional()
  @IsString()
  deviceId?: string;

  @ApiPropertyOptional({ example: 'REHAB' })
  @IsOptional()
  @IsString()
  admissionType?: string;

  @ApiPropertyOptional({ example: 'ACTIVE' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: '2026-03-02' })
  @IsOptional()
  @IsDateString()
  admissionDate?: string;

  @ApiPropertyOptional({ example: '09:00' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ example: '10:00' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ example: '2026-03-30' })
  @IsOptional()
  @IsDateString()
  dischargeDate?: string;

  @ApiPropertyOptional({ example: '2026-03-03' })
  @IsOptional()
  @IsDateString()
  deviceAssignedDate?: string;

  @ApiPropertyOptional({ example: 'Pediatric Neuro Rehab' })
  @IsOptional()
  @IsString()
  clinic?: string;

  @ApiPropertyOptional({ example: 'Ward A - Bed 5' })
  @IsOptional()
  @IsString()
  room?: string;

  @ApiPropertyOptional({ example: 'Needs weekly progress review' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'ArmiGo Glove Unit' })
  @IsOptional()
  @IsString()
  manualDeviceName?: string;

  @ApiPropertyOptional({ example: 'Wearable' })
  @IsOptional()
  @IsString()
  manualDeviceType?: string;

  @ApiPropertyOptional({ example: 'AG-2026-001' })
  @IsOptional()
  @IsString()
  manualDeviceSerial?: string;

  @ApiPropertyOptional({ example: 'https://storage.example.com/pdf/plan.pdf' })
  @IsOptional()
  @IsString()
  treatmentPlanPdf?: string;
}
