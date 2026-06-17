import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
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

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMyCases(@Req() request: AuthenticatedRequest) {
    return this.supportCasesService.getMyCases(request.user.sub);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  async getCaseById(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.supportCasesService.getCaseById(request.user.sub, id);
  }

  @Patch(":id/cancel")
  @UseGuards(JwtAuthGuard)
  async cancelCase(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.supportCasesService.cancelCase(request.user.sub, id);
  }
}
