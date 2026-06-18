import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { HouseholdsService } from "./households.service";
import { AddHouseholdMemberDto } from "./dtos/add-household-member.dto";

@Controller("api/households")
@UseGuards(JwtAuthGuard)
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Get("me")
  async getMyHousehold(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getHouseholdForUser(request.user.sub);
  }

  @Get("me/dashboard")
  async getMyHouseholdDashboard(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getDashboardForUser(request.user.sub);
  }

  @Get("me/procedures")
  async getMyHouseholdProcedures(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getProceduresForUser(request.user.sub);
  }

  @Get("me/members")
  async getMyHouseholdMembers(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getHouseholdMembersForUser(request.user.sub);
  }

  @Post("me/members")
  async addMyHouseholdMember(
    @Req() request: AuthenticatedRequest,
    @Body() data: AddHouseholdMemberDto,
  ) {
    return this.householdsService.addHouseholdMemberForUser(request.user.sub, data);
  }

  @Get("me/members/:id")
  async getMyHouseholdMemberDetail(
    @Req() request: AuthenticatedRequest,
    @Param("id") memberId: string,
  ) {
    return this.householdsService.getHouseholdMemberDetailForUser(request.user.sub, memberId);
  }
}
