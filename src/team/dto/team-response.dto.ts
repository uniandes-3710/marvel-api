import { Team } from '../entities/team.entity.js';

export class TeamResponseDto {
  id: number;
  name: string;
  base: string | null;
  founded_year: number | null;
  active: boolean;

  static from(t: Team): TeamResponseDto {
    return {
      id: t.id,
      name: t.name,
      base: t.base,
      founded_year: t.founded_year,
      active: t.active,
    };
  }
}
