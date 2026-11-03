import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { CreateCharacterDto } from './dto/create-character.dto.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';
import { UpdateStatusDto } from './dto/update-status.dto.js';
import { Character } from './entities/character.entity.js';
import { CharacterStatus } from './enums/character-status.enum.js';
import { TeamService } from '../team/team.service.js';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly charactersRepo: Repository<Character>,
    // Se reutiliza TeamService para no repetir la regla del 404 del equipo.
    private readonly teamService: TeamService,
  ) {}

  async create(createCharacterDto: CreateCharacterDto) {
    await this.ensureAliasAvailable(createCharacterDto.alias); // 409
    if (createCharacterDto.team_id != null) {
      await this.ensureTeamAssignable(createCharacterDto.team_id); // 404 · 400
    }

    const saved = await this.charactersRepo.save(
      this.charactersRepo.create(createCharacterDto),
    );
    return this.findOne(saved.id);
  }

  findAll(filters: { status?: CharacterStatus; teamId?: number }) {
    // TypeORM 1.x falla con valores undefined en `where`, así que solo se
    // agregan los filtros que llegaron.
    const where: FindOptionsWhere<Character> = {};
    if (filters.status !== undefined) where.status = filters.status;
    if (filters.teamId !== undefined) where.team_id = filters.teamId;

    return this.charactersRepo.find({
      where,
      relations: { team: true },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const character = await this.charactersRepo.findOne({
      where: { id },
      relations: { team: true },
    });
    if (!character) {
      throw new NotFoundException(`El personaje con id ${id} no existe`);
    }
    return character;
  }

  async update(id: number, updateCharacterDto: UpdateCharacterDto) {
    const character = await this.findEntity(id); // 404
    await this.ensureAliasAvailable(updateCharacterDto.alias, id); // 409
    if (updateCharacterDto.team_id !== null) {
      await this.ensureTeamAssignable(updateCharacterDto.team_id); // 404 · 400
    }
    this.ensureStatusTransition(character.status, updateCharacterDto.status); // 400

    await this.charactersRepo.save(
      this.charactersRepo.merge(character, updateCharacterDto),
    );
    return this.findOne(id);
  }

  async updateStatus(id: number, { status }: UpdateStatusDto) {
    const character = await this.findEntity(id); // 404
    this.ensureStatusTransition(character.status, status); // 400

    character.status = status;
    await this.charactersRepo.save(character);
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findEntity(id); // 404
    await this.charactersRepo.delete(id);
  }

  // Carga el personaje sin su equipo: las escrituras van por team_id, y una
  // relación `team` cargada lo sobrescribiría al guardar.
  private async findEntity(id: number) {
    const character = await this.charactersRepo.findOneBy({ id });
    if (!character) {
      throw new NotFoundException(`El personaje con id ${id} no existe`);
    }
    return character;
  }

  private async ensureAliasAvailable(alias: string, excludeId?: number) {
    const existing = await this.charactersRepo.findOneBy({ alias });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Ya existe un personaje con alias ${alias}`);
    }
  }

  // Regla 4: el equipo debe existir (el 404 lo lanza TeamService) y estar activo.
  private async ensureTeamAssignable(teamId: number) {
    const team = await this.teamService.findOne(teamId);
    if (!team.active) {
      throw new BadRequestException(`El equipo ${team.name} no está activo`);
    }
  }

  // Regla 7: depende del estado actual, que solo conoce el servicio.
  private ensureStatusTransition(from: CharacterStatus, to: CharacterStatus) {
    if (from === CharacterStatus.RETIRED && to === CharacterStatus.INJURED) {
      throw new BadRequestException(
        'Un personaje retirado no puede pasar a INJURED',
      );
    }
  }
}
