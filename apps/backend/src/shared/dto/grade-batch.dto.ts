import { IsIn, IsOptional, IsString } from "class-validator";
import { GRADE_CONSTANTS, BATCH_CONSTANTS } from "../../constants/index";

export class GradeDto {
  @IsString()
  @IsIn(GRADE_CONSTANTS.ALLOWED_GRADES, {
    message: "Grade must be between 1 and 11",
  })
  grade!: string;
}

export class BatchDto {
  @IsOptional()
  @IsString()
  @IsIn(BATCH_CONSTANTS.ALLOWED_BATCHES, {
    message:
      "Batch must be one of: Batch01, Batch02, Batch03, Batch04, Batch05",
  })
  batch?: string;
}

export class GradeBatchDto extends GradeDto {
  @IsOptional()
  @IsString()
  @IsIn(BATCH_CONSTANTS.ALLOWED_BATCHES, {
    message:
      "Batch must be one of: Batch01, Batch02, Batch03, Batch04, Batch05",
  })
  batch?: string;
}
