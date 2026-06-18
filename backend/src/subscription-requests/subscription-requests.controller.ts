import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { AuthenticatedRequest } from "src/auth/guards/jwt-auth.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { CreateSubscriptionRequestDto } from "./dtos/create-subscription-request.dto";
import { CreateImagineRDraftDto, UpdateImagineRRequestDto } from "./dtos/imagine-r-subscription-request.dto";
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

  @Post("imagine-r/draft")
  async createImagineRDraft(
    @Req() request: AuthenticatedRequest,
    @Body() data: CreateImagineRDraftDto,
  ) {
    return this.subscriptionRequestsService.createImagineRDraftForUser(request.user.sub, data);
  }

  @Patch(":id/imagine-r")
  async updateImagineR(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Body() data: UpdateImagineRRequestDto,
  ) {
    return this.subscriptionRequestsService.updateImagineRForUser(request.user.sub, id, data);
  }

  @Post(":id/imagine-r/documents/:documentType/file")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: 8 * 1024 * 1024 } }))
  async uploadImagineRDocumentFile(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("documentType") documentType: string,
    @UploadedFile() file: any,
  ) {
    return this.subscriptionRequestsService.uploadImagineRDocumentFileForUser(
      request.user.sub,
      id,
      documentType,
      file,
    );
  }

  @Delete(":id/imagine-r/documents/:documentType/file")
  async deleteImagineRDocumentFile(
    @Req() request: AuthenticatedRequest,
    @Param("id") id: string,
    @Param("documentType") documentType: string,
  ) {
    return this.subscriptionRequestsService.deleteImagineRDocumentFileForUser(
      request.user.sub,
      id,
      documentType,
    );
  }

  @Post(":id/imagine-r/submit")
  async submitImagineR(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.subscriptionRequestsService.submitImagineRForUser(request.user.sub, id);
  }

  @Patch(":id/renewal/cancel")
  async cancelRenewal(@Req() request: AuthenticatedRequest, @Param("id") id: string) {
    return this.subscriptionRequestsService.cancelRenewalForUser(request.user.sub, id);
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
