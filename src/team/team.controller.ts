import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { TeamService } from './team.service.js';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { AssignCharactersDto } from './dto/assign-characters.dto.js';
import { TeamResponseDto } from './dto/team-response.dto.js';
import { CharacterResponseDto } from '../characters/dto/character-response.dto.js';

@Controller('teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  async create(@Body() createTeamDto: CreateTeamDto) {
    return TeamResponseDto.from(await this.teamService.create(createTeamDto));
  }

  @Get()
  async findAll() {
    const teams = await this.teamService.findAll();
    return teams.map((t) => TeamResponseDto.from(t));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return TeamResponseDto.from(await this.teamService.findOne(id));
  }

  @Get(':id/characters')
  async findCharacters(@Param('id', ParseIntPipe) id: number) {
    const characters = await this.teamService.findCharacters(id);
    return characters.map((c) => CharacterResponseDto.from(c));
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return TeamResponseDto.from(
      await this.teamService.update(id, updateTeamDto),
    );
  }

  @Patch(':id/characters')
  async assignCharacters(
    @Param('id', ParseIntPipe) id: number,
    @Body() assignCharactersDto: AssignCharactersDto,
  ) {
    return TeamResponseDto.from(
      await this.teamService.assignCharacters(id, assignCharactersDto),
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.teamService.remove(id);
  }
}
