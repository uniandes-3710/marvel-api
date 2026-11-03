import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TeamService } from './team.service.js';
import { TeamController } from './team.controller.js';
import { Team } from './entities/team.entity.js';
import { Character } from '../characters/entities/character.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Team, Character])],
  controllers: [TeamController],
  providers: [TeamService],
  // CharactersService lo usa para validar el equipo (regla 4).
  exports: [TeamService],
})
export class TeamModule {}
