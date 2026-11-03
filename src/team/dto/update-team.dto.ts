import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

// PUT /teams/:id replaces the whole team, so every field is required.
// base and founded_year are nullable columns, so null is accepted for them.
export class UpdateTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ValidateIf((dto: UpdateTeamDto) => dto.base !== null)
  @IsString()
  @MaxLength(150)
  base: string | null;

  @ValidateIf((dto: UpdateTeamDto) => dto.founded_year !== null)
  @IsInt()
  @Min(1900)
  @Max(2100)
  founded_year: number | null;

  @IsBoolean()
  active: boolean;
}
