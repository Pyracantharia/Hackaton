import { prisma } from "../prisma";
import { CreateUserDto } from "./dtos/create-user.dto";
import argon2 from "argon2";

class User {
  async getAllUsers() {
    try {
      const users = await prisma.user.findMany();
      return users.map(user => {
        const { password, ...rest } = user;
        return rest;
      });
    } catch (error: any) {
      throw new Error(`Erreur lors de la récupération des utilisateurs: ${error.message}`);
    }
  }

  async createUser(data: CreateUserDto){
    try {
      const existingUser = await prisma.user.findUnique({
        where: {
          email: data.email
        }
      });

      if(existingUser){
        throw new Error("Un utilisateur avec cet email existe déjà");
      }

      if(data.password !== data.confirmationPassword){
        throw new Error("Les mots de passe ne correspondent pas");
      }

      const hashedPassword = await argon2.hash(data.password);
      const createdUser = await prisma.user.create({
        data: {
          email: data.email,
          firstname: data.firstname,
          lastname: data.lastname,
          password: hashedPassword
        }
      })
      const {password, ...rest} = createdUser;
      return rest;
    } catch (error: any) {
      throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
    }
  }
}

export const userManager = new User();