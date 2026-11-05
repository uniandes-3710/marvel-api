import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  Query,
  ParseIntPipe,
  ParseEnumPipe,
} from '@nestjs/common';
import { CharactersService } from './characters.service.js';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { CharacterResponseDto } from './dto/character-response.dto.js';
import { CharacterStatus } from './enums/character-status.enum.js';
import { Public } from '../auth/decorators.js';

@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post()
  async create(@Body() createCharacterDto: CreateCharacterDto) {
    return CharacterResponseDto.from(
      await this.charactersService.create(createCharacterDto),
    );
  }

  @Get()
  @Public()
  async findAll(
    @Query('status', new ParseEnumPipe(CharacterStatus, { optional: true }))
    status?: CharacterStatus,
    @Query('teamId', new ParseIntPipe({ optional: true })) teamId?: number,
  ) {
    const characters = await this.charactersService.findAll({ status, teamId });
    return characters.map((c) => CharacterResponseDto.from(c));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return CharacterResponseDto.from(await this.charactersService.findOne(id));
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCharacterDto: UpdateCharacterDto,
  ) {
    return CharacterResponseDto.from(
      await this.charactersService.update(id, updateCharacterDto),
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return CharacterResponseDto.from(
      await this.charactersService.updateStatus(id, updateStatusDto),
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.remove(id);
  }
}
