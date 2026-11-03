import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanetDto } from './create-planet.dto.js';

export class UpdatePlanetDto extends PartialType(CreatePlanetDto) {}
