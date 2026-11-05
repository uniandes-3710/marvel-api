import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateTeamDto } from './dto/create-team.dto.js';
import { UpdateTeamDto } from './dto/update-team.dto.js';
import { AssignCharactersDto } from './dto/assign-characters.dto.js';
import { Team } from './entities/team.entity.js';
import { Character } from '../characters/entities/character.entity.js';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Team)
    private readonly teamsRepo: Repository<Team>,
    @InjectRepository(Character)
    private readonly charactersRepo: Repository<Character>,
  ) {}

  async create(createTeamDto: CreateTeamDto) {
    const { characterIds, ...teamData } = createTeamDto;
    await this.ensureNameAvailable(teamData.name); // 409
    if (characterIds?.length) {
      // Si no se envía `active`, la base lo deja en true.
      if (teamData.active === false) {
        throw new BadRequestException(
          'No se pueden asignar personajes a un equipo inactivo',
        );
      }
      await this.ensureCharactersExist(characterIds); // 404
    }

    // Crear el equipo y mover sus personajes deben funcionar o fallar juntos.
    const team = await this.teamsRepo.manager.transaction(async (manager) => {
      const saved = await manager.save(manager.create(Team, teamData));
      if (characterIds?.length) {
        await manager.update(
          Character,
          { id: In(characterIds) },
          { team_id: saved.id },
        );
      }
      return saved;
    });
    return this.findOne(team.id);
  }

  findAll() {
    return this.teamsRepo.find({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    const team = await this.teamsRepo.findOneBy({ id });
    if (!team) {
      throw new NotFoundException(`El equipo con id ${id} no existe`);
    }
    return team;
  }

  async findCharacters(id: number) {
    await this.findOne(id); // 404
    return this.charactersRepo.find({
      where: { team_id: id },
      relations: { team: true },
      order: { id: 'ASC' },
    });
  }

  async update(id: number, updateTeamDto: UpdateTeamDto) {
    const team = await this.findOne(id); // 404
    await this.ensureNameAvailable(updateTeamDto.name, id); // 409

    await this.teamsRepo.save(this.teamsRepo.merge(team, updateTeamDto));
    return this.findOne(id);
  }

  async assignCharacters(id: number, { characterIds }: AssignCharactersDto) {
    const team = await this.findOne(id); // 404
    if (!team.active) {
      throw new BadRequestException(`El equipo ${team.name} no está activo`);
    }
    await this.ensureCharactersExist(characterIds); // 404

    // Los personajes que ya pertenecen a otro equipo se reasignan a este.
    await this.charactersRepo.update({ id: In(characterIds) }, { team_id: id });
    return team;
  }

  // Regla 6: un equipo con personajes no se elimina; se desactiva con PUT.
  async remove(id: number) {
    const team = await this.findOne(id); // 404
    const characters = await this.charactersRepo.countBy({ team_id: id });
    if (characters > 0) {
      throw new ConflictException(
        `El equipo ${team.name} tiene ${characters} personajes asociados; desactívalo con PUT`,
      );
    }
    await this.teamsRepo.delete(id);
  }

  private async ensureNameAvailable(name: string, excludeId?: number) {
    const existing = await this.teamsRepo.findOneBy({ name });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un equipo con nombre ${name}`);
    }
  }

  private async ensureCharactersExist(ids: number[]) {
    const found = await this.charactersRepo.findBy({ id: In(ids) });
    const foundIds = new Set(found.map((character) => character.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new NotFoundException(
        `No existen los personajes con id: ${missing.join(', ')}`,
      );
    }
  }
}
