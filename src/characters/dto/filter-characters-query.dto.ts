import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CharacterStatus } from '../enums/character-status.enum.js';

export class FilterCharactersQueryDto {
  @IsOptional()
  @IsEnum(CharacterStatus)
  status?: CharacterStatus;

  // Query params arrive as strings.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  teamId?: number;
}
