import { IsEmail, IsNotEmpty, IsString, Matches } from "class-validator";

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d\s])\S{12,}$/, {
    message:
      "Le mot de passe doit contenir 12 caractères minimum, une minuscule, une majuscule, un chiffre, un caractère spécial et aucun espace.",
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  confirmationPassword: string
}
