import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service.js';
import { CharactersController } from './characters.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity.js';
import { Team } from '../team/entities/team.entity.js';
import { Planet } from '../planet/entities/planet.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Planet, Team])],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
