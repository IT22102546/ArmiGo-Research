import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus, Get } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./guards/local-auth.guard";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { ApiTags, ApiBody, ApiBearerAuth } from "@nestjs/swagger";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: LoginDto })
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  async getProfile(@Request() req: { user: any }) {
    // The user is attached to the request by JwtAuthGuard
    return req.user;
  }

  @Public()
  @Post("test-login")
  async testLogin(@Body() loginDto: LoginDto) {
    console.log('Test login received:', loginDto);
    const user = await this.authService.validateUser(loginDto.identifier, loginDto.password);
    return { found: !!user, user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout() {
    return { message: "Logged out successfully" };
  }
}