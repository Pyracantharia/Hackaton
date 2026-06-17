import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "src/auth/auth.constants";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaModule } from "src/prisma/prisma.module";
import { AdminController } from "./admin.controller";
import { AdminRoleGuard } from "./admin-role.guard";
import { AdminService } from "./admin.service";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [AdminController],
  providers: [AdminService, JwtAuthGuard, AdminRoleGuard],
})
export class AdminModule {}
