import { Controller, Get, Param, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { HouseholdsService } from "./households.service";

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

  @Get("me/members")
  async getMyHouseholdMembers(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getHouseholdMembersForUser(request.user.sub);
  }

  @Get("me/members/:id")
  async getMyHouseholdMemberDetail(
    @Req() request: AuthenticatedRequest,
    @Param("id") memberId: string,
  ) {
    return this.householdsService.getHouseholdMemberDetailForUser(request.user.sub, memberId);
  }
}
