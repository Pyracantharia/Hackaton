import { BadRequestException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { RegisterUserDto } from "./dtos/register-user.dto";
import { PrismaService } from "src/prisma/prisma.service";
import argon2 from "argon2";

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService
  ){}

  async registerUser(data: RegisterUserDto) {
   try {
    const existingUser = await this.prismaService.user.findUnique({
      where: {
        email: data.email
      }
    });

    if(existingUser){
      throw new BadRequestException("Un utilisateur avec cet email existe déjà");
    }

    if(data.password !== data.confirmationPassword){
      throw new BadRequestException("Les mots de passe ne correspondent pas");
    }
    
    const hashedPassword = await argon2.hash(data.password);
    const {confirmationPassword, ...userPayload} = data
    const newUser = await this.prismaService.user.create({
      data: {
       ...userPayload,
       password: hashedPassword
      }
    });

    const {password, ...userWithoutPassword} = newUser
    return {
      message: "Compte crée avec succès",
      user: userWithoutPassword
    }
   } catch (error: any) {
      throw new InternalServerErrorException(`Une erreur est survenue lors de l'enregistrement de l'utilisateur: ${error.message}`)
   }
  }
}