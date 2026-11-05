import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm/browser/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  async findOneByEmail(email: string) {
    return this.userRepo.findOne({ where: { email } });
  }

  async create(email: string, userName: string, password: string) {
    const saved = await this.userRepo.save(
      this.userRepo.create({ email, userName, password }),
    );
    return saved;
  }

  async login(email: string) {
    const user = await this.userRepo.findOne({
      where: { email },
      select: { email: true, userName: true, password: true, id: true },
    });
    if (!user) {
      throw new Error('Invalid email or password');
    }
    return user;
  }
}
