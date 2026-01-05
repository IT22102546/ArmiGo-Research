import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
} from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  toId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(["DIRECT", "GROUP", "ANNOUNCEMENT"])
  @IsOptional()
  messageType?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class ApproveMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;
}

export class RejectMessageDto {
  @IsString()
  @IsNotEmpty()
  messageId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}

export class BulkApproveDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  messageIds: string[];
}

export class GetConversationDto {
  @IsString()
  @IsNotEmpty()
  withUserId: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
