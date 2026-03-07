import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Response,
  BadRequestException,
  Get,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { ApiTags, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  async login(
    @Request() req: any,
    @Body() loginDto: LoginDto,
    @Response() res: any
  ) {
    const user = req.user;

    // Validate allowedRoles if provided
    if (loginDto.allowedRoles && loginDto.allowedRoles.length > 0) {
      if (!loginDto.allowedRoles.includes(user.role)) {
        throw new BadRequestException("User role not authorized for this login endpoint");
      }
    }

    const result = await this.authService.login(user);
    
    // Set httpOnly cookies for web clients
    res.cookie("access_token", result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/",
    });
    
    // Return tokens + user in body for mobile clients (mobile can't use httpOnly cookies)
    return res.json({ accessToken: result.accessToken, user: result.user });
  }

  @Public()
  @Post("test-login")
  async testLogin(@Body() loginDto: LoginDto) {
    console.log('Test login received:', loginDto);
    const user = await this.authService.validateUser(
      loginDto.identifier,
      loginDto.password,
      loginDto.allowedRoles
    );
    return { found: !!user, user };
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: { user: any }) {
    return { user: req.user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Response() res: any) {
    // Clear cookies
    res.clearCookie("access_token", { path: "/" });
    return res.json({ message: "Logged out successfully" });
  }
}