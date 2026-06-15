import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
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
}