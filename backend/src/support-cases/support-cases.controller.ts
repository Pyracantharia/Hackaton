import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { CreateFoundPassDto } from "./dtos/create-found-pass.dto";
import { CreateLostPassDto } from "./dtos/create-lost-pass.dto";
import { SupportCasesService } from "./support-cases.service";

@Controller("api/support-cases")
export class SupportCasesController {
  constructor(private readonly supportCasesService: SupportCasesService) {}

  @Post("lost-pass")
  @UseGuards(JwtAuthGuard)
  async createLostPass(
    @Req() request: AuthenticatedRequest,
    @Body() body: CreateLostPassDto,
  ) {
    return this.supportCasesService.createLostPassCase(request.user.sub, body);
  }

  @Post("found-pass")
  async createFoundPass(@Body() body: CreateFoundPassDto) {
    return this.supportCasesService.createFoundPassCase(body);
  }
}
