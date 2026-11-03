import { Module } from '@nestjs/common';
import { CharactersService } from './characters.service.js';
import { CharactersController } from './characters.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from './entities/character.entity.js';
import { Planet } from '../planet/entities/planet.entity.js';
import { TeamModule } from '../team/team.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Character, Planet]), TeamModule],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
