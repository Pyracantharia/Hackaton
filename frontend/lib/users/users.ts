import { CreateUserDto } from "./dtos/create-user.dto";

class User {
  async getAllUsers() {
    throw new Error("La récupération des utilisateurs doit passer par l'API backend.");
  }

  async createUser(data: CreateUserDto) {
    if (data.password !== data.confirmationPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    throw new Error("La création d'utilisateur doit passer par l'API backend.");
  }
}

export const userManager = new User();
