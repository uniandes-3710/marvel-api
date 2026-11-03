import { Module } from '@nestjs/common';
import { PlanetService } from './planet.service.js';
import { PlanetController } from './planet.controller.js';

@Module({
  controllers: [PlanetController],
  providers: [PlanetService],
})
export class PlanetModule {}
