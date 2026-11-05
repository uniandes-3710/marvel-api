import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.enum.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userName: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ type: 'enum', enum: Role, default: Role.AGENT })
  role: Role;
}
