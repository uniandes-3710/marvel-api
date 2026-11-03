import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Team } from '../../team/entities/team.entity.js';
import { CharacterStatus } from '../enums/character-status.enum.js';

// Mirrors the "characters" table from marvel-characters/db/init.sql.
// Constraint names match the ones Postgres generated so TypeORM sees them as the same.
@Entity('characters')
@Unique('characters_alias_key', ['alias'])
@Check('characters_power_level_check', `"power_level" BETWEEN 1 AND 100`)
@Check(
  'characters_status_check',
  `"status" IN ('ACTIVE', 'INJURED', 'MISSING', 'RETIRED')`,
)
export class Character {
  @PrimaryGeneratedColumn({ primaryKeyConstraintName: 'characters_pkey' })
  id: number;

  @Column({ type: 'varchar', length: 100 })
  real_name: string;

  @Column({ type: 'varchar', length: 100 })
  alias: string;

  @Column({ type: 'varchar', length: 150 })
  main_power: string;

  @Column({ type: 'integer' })
  power_level: number;

  // The column is a VARCHAR with a CHECK, not a Postgres enum type.
  @Index('idx_characters_status')
  @Column({ type: 'varchar', length: 20, default: CharacterStatus.ACTIVE })
  status: CharacterStatus;

  @Column({ type: 'boolean', default: false })
  is_villain: boolean;

  // Raw FK value, mapped to the same column as the "team" relation below.
  @Index('idx_characters_team')
  @Column({ type: 'integer', nullable: true })
  team_id: number | null;

  @ManyToOne(() => Team, (team) => team.characters, {
    nullable: true,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({
    name: 'team_id',
    foreignKeyConstraintName: 'characters_team_id_fkey',
  })
  team: Team | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}
