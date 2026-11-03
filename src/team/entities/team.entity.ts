import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Character } from '../../characters/entities/character.entity.js';

// Mirrors the "teams" table from marvel-characters/db/init.sql.
// Constraint names match the ones Postgres generated so TypeORM sees them as the same.
@Entity('teams')
@Unique('teams_name_key', ['name'])
@Check('teams_founded_year_check', `"founded_year" BETWEEN 1900 AND 2100`)
export class Team {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'teams_pkey' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  base: string | null;

  @Column({ type: 'integer', nullable: true })
  founded_year: number | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;

  @OneToMany(() => Character, (character) => character.team)
  characters: Character[];
}
