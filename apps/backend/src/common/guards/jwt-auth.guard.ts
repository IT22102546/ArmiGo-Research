import { Injectable, ExecutionContext, Logger } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`🔓 JwtAuthGuard called for ${request.method} ${request.url}`);

    const isPublic = this.reflector.getAllAndOverride<boolean>("isPublic", [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log(`  - Route is public, allowing access`);
      return true;
    }

    this.logger.log(`  - Route is protected, validating JWT`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`🔍 JwtAuthGuard handleRequest for ${request.method} ${request.url}`);
    this.logger.log(`  - Error: ${err?.message || 'none'}`);
    this.logger.log(`  - User: ${user?.id || 'none'}`);
    this.logger.log(`  - Info: ${info?.message || 'none'}`);

    if (err || !user) {
      this.logger.error(`❌ JWT Authentication failed: ${err?.message || info?.message || 'Unknown error'}`);
    }

    return super.handleRequest(err, user, info, context);
  }
}
