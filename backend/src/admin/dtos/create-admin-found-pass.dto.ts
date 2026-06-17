import { IsOptional, IsString, Matches } from "class-validator";

export class CreateAdminFoundPassDto {
  @IsString()
  @Matches(/^[0-9A-Za-z* -]{4,32}$/)
  passNumber: string;

  @IsString()
  @IsOptional()
  deskName?: string;
}
