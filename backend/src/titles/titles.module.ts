import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JWT_SECRET } from "src/auth/auth.constants";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaModule } from "src/prisma/prisma.module";
import { TitlesController } from "./titles.controller";
import { TitlesService } from "./titles.service";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: "7d" },
    }),
  ],
  controllers: [TitlesController],
  providers: [TitlesService, JwtAuthGuard],
  exports: [TitlesService],
})
export class TitlesModule {}
