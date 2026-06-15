import { Module } from "@nestjs/common";
import { PrismaModule } from "src/prisma/prisma.module";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";

@Module({
  imports: [PrismaModule],
  exports: [AuthService],
  controllers: [AuthController],
  providers: [AuthService]
})
export class AuthModule{}