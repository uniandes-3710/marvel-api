import { Character } from '../entities/character.entity.js';
import { CharacterStatus } from '../enums/character-status.enum.js';

export class CharacterResponseDto {
  id: number;
  real_name: string;
  alias: string;
  main_power: string;
  power_level: number;
  status: CharacterStatus;
  is_villain: boolean;
  // Resumen del equipo; null si el personaje no tiene equipo.
  team: { id: number; name: string } | null;

  static from(c: Character): CharacterResponseDto {
    return {
      id: c.id,
      real_name: c.real_name,
      alias: c.alias,
      main_power: c.main_power,
      power_level: c.power_level,
      status: c.status,
      is_villain: c.is_villain,
      team: c.team ? { id: c.team.id, name: c.team.name } : null,
    };
  }
}
