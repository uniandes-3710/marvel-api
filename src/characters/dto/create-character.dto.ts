import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CharacterStatus } from '../enums/character-status.enum.js';

// @MaxLength replica el tamaño de las columnas VARCHAR de la tabla.
export class CreateCharacterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  real_name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  alias: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  main_power: string;

  // Regla 3 del enunciado: power_level entre 1 y 100...
  @IsInt()
  @Min(1)
  @Max(100)
  power_level: number;

  // ...y status debe ser uno de los valores de CharacterStatus.
  @IsEnum(CharacterStatus)
  status: CharacterStatus;

  @IsBoolean()
  is_villain: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  team_id?: number | null;
}
