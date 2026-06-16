import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dtos/login.dto";
import { RegisterFamilyDto } from "./dtos/register-family.dto";
import { RegisterUserDto } from "./dtos/register-user.dto";

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService
  ){}

  @Post('register')
  async register(
    @Body() body: RegisterUserDto
  ){
    return await this.authService.registerUser(body)
  }

  @Post('register-family')
  async registerFamily(
    @Body() body: RegisterFamilyDto
  ){
    return await this.authService.registerFamily(body)
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto
  ){
    return await this.authService.login(body)
  }
}
