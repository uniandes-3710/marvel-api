import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PlanetService } from './planet.service.js';
import { CreatePlanetDto } from './dto/create-planet.dto.js';
import { UpdatePlanetDto } from './dto/update-planet.dto.js';

@Controller('planet')
export class PlanetController {
  constructor(private readonly planetService: PlanetService) {}

  @Post()
  create(@Body() createPlanetDto: CreatePlanetDto) {
    return this.planetService.create(createPlanetDto);
  }

  @Get()
  findAll() {
    return this.planetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.planetService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlanetDto: UpdatePlanetDto) {
    return this.planetService.update(+id, updatePlanetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.planetService.remove(+id);
  }
}
