import { IsNotEmpty, IsString } from 'class-validator';

export class RegisterCredentialsDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class LoginCredentialsDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ResponseAuthCredentialsDto {
  @IsString()
  @IsNotEmpty()
  userName: string;

  static from(user: { userName: string }): ResponseAuthCredentialsDto {
    return { userName: user.userName };
  }
}
