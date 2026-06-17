import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { RecommendTitleDto } from "./dtos/recommend-title.dto";
import { TitlesService } from "./titles.service";

@Controller("api/titles")
export class TitlesController {
  constructor(private readonly titlesService: TitlesService) {}

  @Get("offers")
  async getOffers(
    @Query("profileType") profileType?: string,
    @Query("targetProfile") targetProfile?: string,
    @Query("productType") productType?: string,
  ) {
    return this.titlesService.getOffers({ profileType, targetProfile, productType });
  }

  @Get("offers/:slug")
  async getOfferDetail(@Param("slug") slug: string) {
    return this.titlesService.getOfferDetail(slug);
  }

  @Post("recommend")
  @UseGuards(JwtAuthGuard)
  async recommend(
    @Req() request: AuthenticatedRequest,
    @Body() payload: RecommendTitleDto,
  ) {
    return this.titlesService.recommendForUser(request.user.sub, payload);
  }
}
