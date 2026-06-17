import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { AdminRoleGuard } from "./admin-role.guard";
import { AdminService } from "./admin.service";
import { UpdateAdminSubscriptionRequestDto } from "./dtos/update-admin-subscription-request.dto";
import { UpdateAdminSupportCaseDto } from "./dtos/update-admin-support-case.dto";

@Controller("api/admin")
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get("search")
  async search(@Query("q") query = "") {
    return this.adminService.search(query);
  }

  @Get("users")
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get("users/:id")
  async getUser(@Param("id") id: string) {
    return this.adminService.getUser(id);
  }

  @Get("families")
  async getFamilies() {
    return this.adminService.getFamilies();
  }

  @Get("families/:id")
  async getFamily(@Param("id") id: string) {
    return this.adminService.getFamily(id);
  }

  @Get("subscription-requests")
  async getSubscriptionRequests() {
    return this.adminService.getSubscriptionRequests();
  }

  @Patch("subscription-requests/:id")
  async updateSubscriptionRequest(
    @Param("id") id: string,
    @Body() data: UpdateAdminSubscriptionRequestDto,
  ) {
    return this.adminService.updateSubscriptionRequest(id, data);
  }

  @Get("support-cases")
  async getSupportCases() {
    return this.adminService.getSupportCases();
  }

  @Patch("support-cases/:id")
  async updateSupportCase(
    @Param("id") id: string,
    @Body() data: UpdateAdminSupportCaseDto,
  ) {
    return this.adminService.updateSupportCase(id, data);
  }
}
