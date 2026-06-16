import { IsNotEmpty, IsString } from "class-validator";

export class CreateLostPassDto {
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
