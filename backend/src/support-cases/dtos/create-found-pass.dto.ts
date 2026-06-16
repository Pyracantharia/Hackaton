import { IsBoolean, IsNotEmpty, IsString, Matches } from "class-validator";

export class CreateFoundPassDto {
  @IsString()
  @Matches(/^[0-9A-Za-z-]{6,32}$/, {
    message: "Le numero de passe doit contenir entre 6 et 32 caracteres alphanumeriques.",
  })
  passNumber: string;

  @IsString()
  @IsNotEmpty()
  foundLocation: string;

  @IsBoolean()
  depositedAtDesk: boolean;
}
