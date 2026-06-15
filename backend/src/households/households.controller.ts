import { Controller, Get, Req, UseGuards } from "@nestjs/common";
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

  @Get("me/members")
  async getMyHouseholdMembers(@Req() request: AuthenticatedRequest) {
    return this.householdsService.getHouseholdMembersForUser(request.user.sub);
  }
}
