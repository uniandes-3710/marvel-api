import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import {
  LoginCredentialsDto,
  RegisterCredentialsDto,
  ResponseAuthCredentialsDto,
} from './dto/credentials.dto.js';
import bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async register(user: RegisterCredentialsDto) {
    if (await this.usersService.findOneByEmail(user.email)) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(user.password, 10);
    return ResponseAuthCredentialsDto.from(
      await this.usersService.create(user.email, user.userName, hashedPassword),
    );
  }

  async login(user: LoginCredentialsDto) {
    const existingUser = await this.usersService.login(user.email);
    if (!existingUser) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(
      user.password,
      existingUser.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return ResponseAuthCredentialsDto.from(existingUser);
  }
}
