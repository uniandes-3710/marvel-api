// Al agregar Swagger, importar desde '@nestjs/swagger'
import { PickType } from '@nestjs/mapped-types';
import { CreateCharacterDto } from './create-character.dto.js';

// El PATCH de estado usa su propio DTO: solo acepta status.
export class UpdateStatusDto extends PickType(CreateCharacterDto, [
  'status',
] as const) {}
