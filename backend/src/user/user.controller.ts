import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";

@Controller('api/users')
export class UserController {
  constructor(
    private readonly userService: UserService
  ){}

  @Post()
  async createUser(
    @Body() body: any
  ){
    
  }
}