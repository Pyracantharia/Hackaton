import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";

@Injectable()
export class AdminRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (request.user?.role === "ADMIN" || request.user?.role === "EMPLOYEE") {
      return true;
    }

    throw new ForbiddenException("Acces reserve aux agents Comutitres.");
  }
}
