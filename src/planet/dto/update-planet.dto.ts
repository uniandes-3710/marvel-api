import { PartialType } from '@nestjs/swagger';
import { CreatePlanetDto } from './create-planet.dto.js';

export class UpdatePlanetDto extends PartialType(CreatePlanetDto) {}
