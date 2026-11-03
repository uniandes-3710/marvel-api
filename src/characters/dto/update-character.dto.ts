import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { CharacterStatus } from '../enums/character-status.enum.js';

// PUT /characters/:id replaces the whole character, so every field is required.
export class UpdateCharacterDto {
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

  @IsInt()
  @Min(1)
  @Max(100)
  power_level: number;

  @IsEnum(CharacterStatus)
  status: CharacterStatus;

  @IsBoolean()
  is_villain: boolean;

  // Required, but null is allowed to leave the character without a team.
  @ValidateIf((dto: UpdateCharacterDto) => dto.team_id !== null)
  @IsInt()
  @Min(1)
  team_id: number | null;
}
