import { PickType } from '@nestjs/swagger';
import { CreateCharacterDto } from './create-character.dto.js';

// El PATCH de estado usa su propio DTO: solo acepta status.
export class UpdateStatusDto extends PickType(CreateCharacterDto, [
  'status',
] as const) {}
