// Al agregar Swagger, importar desde '@nestjs/swagger'
import { OmitType } from '@nestjs/mapped-types';
import { IsInt, Min, ValidateIf } from 'class-validator';
import { CreateCharacterDto } from './create-character.dto.js';

// PUT /characters/:id reemplaza el personaje completo: mismo contrato que crear,
// salvo team_id, que se vuelve a declarar abajo.
export class UpdateCharacterDto extends OmitType(CreateCharacterDto, [
  'team_id',
] as const) {
  // Obligatorio, pero acepta null para dejar al personaje sin equipo.
  @ValidateIf((dto: UpdateCharacterDto) => dto.team_id !== null)
  @IsInt()
  @Min(1)
  team_id: number | null;
}
