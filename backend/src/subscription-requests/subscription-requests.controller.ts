import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateSubscriptionRequestDto } from "./dtos/create-subscription-request.dto";
import { UpdateSubscriptionRequestDto } from "./dtos/update-subscription-request.dto";
import { SubscriptionRequestsService } from "./subscription-requests.service";

@Controller("api/subscription-requests")
@UseGuards(JwtAuthGuard)
export class SubscriptionRequestsController {
  constructor(private readonly subscriptionRequestsService: SubscriptionRequestsService) {}

  @Post()
  async create(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateSubscriptionRequestDto,
  ) {
    return this.subscriptionRequestsService.createForUser(request.user.sub, data);
  }

  @Get(":id")
  async getOne(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.subscriptionRequestsService.getForUser(request.user.sub, id);
  }

  @Patch(":id")
  async update(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() data: UpdateSubscriptionRequestDto,
  ) {
    return this.subscriptionRequestsService.updateForUser(request.user.sub, id, data);
  }
}
