import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@common/guards/jwt-auth.guard";
import { DeviceTokenService } from "./device-token.service";

class RegisterTokenDto {
  token: string;
  platform: "web" | "android" | "ios";
  deviceId?: string;
}

@ApiTags("Push Notifications")
@ApiBearerAuth()
@Controller("api/v1/push")
@UseGuards(JwtAuthGuard)
export class DeviceTokenController {
  private readonly logger = new Logger(DeviceTokenController.name);

  constructor(private deviceTokenService: DeviceTokenService) {}

  @Post("register")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Register device for push notifications" })
  @ApiResponse({ status: 200, description: "Token registered successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async registerToken(@Req() req: any, @Body() dto: RegisterTokenDto) {
    const userId = req.user.sub;

    const deviceToken = await this.deviceTokenService.registerToken({
      userId,
      token: dto.token,
      platform: dto.platform,
      deviceId: dto.deviceId,
    });

    return {
      success: true,
      message: "Device registered for push notifications",
      tokenId: deviceToken.id,
    };
  }

  @Delete("unregister")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unregister device from push notifications" })
  @ApiResponse({ status: 200, description: "Token unregistered successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async unregisterToken(@Body() dto: { token: string }) {
    await this.deviceTokenService.deactivateToken(dto.token);

    return {
      success: true,
      message: "Device unregistered from push notifications",
    };
  }

  @Delete("unregister-all")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Unregister all devices for current user" })
  @ApiResponse({
    status: 200,
    description: "All tokens unregistered successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async unregisterAllTokens(@Req() req: any) {
    const userId = req.user.sub;
    await this.deviceTokenService.deleteUserTokens(userId);

    return {
      success: true,
      message: "All devices unregistered from push notifications",
    };
  }
}
