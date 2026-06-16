import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "src/auth/auth.constants";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaModule } from "src/prisma/prisma.module";
import { SupportCasesController } from "./support-cases.controller";
import { SupportCasesService } from "./support-cases.service";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [SupportCasesController],
  providers: [SupportCasesService, JwtAuthGuard],
})
export class SupportCasesModule {}
