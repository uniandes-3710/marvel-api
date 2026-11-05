import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import {
  LoginCredentialsDto,
  RegisterCredentialsDto,
} from './dto/credentials.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: RegisterCredentialsDto) {
    return this.authService.register(user);
  }

  @Post('login')
  async login(@Body() user: LoginCredentialsDto) {
    return this.authService.login(user);
  }
}
