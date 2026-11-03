import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CharactersService } from './characters.service.js';
import { Character } from './entities/character.entity.js';
import { CharacterStatus } from './enums/character-status.enum.js';
import { TeamService } from '../team/team.service.js';
import { UpdateCharacterDto } from './dto/update-character.dto.js';

describe('CharactersService', () => {
  let service: CharactersService;
  const charactersRepo = {
    create: vi.fn((dto: object) => ({ ...dto })),
    merge: vi.fn((entity: object, dto: object) => Object.assign(entity, dto)),
    save: vi.fn((entity: object) => Promise.resolve({ id: 1, ...entity })),
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    delete: vi.fn(),
  };
  const teamService = { findOne: vi.fn() };

  const character = (overrides: Partial<Character> = {}) =>
    ({
      id: 1,
      alias: 'Thor',
      status: CharacterStatus.ACTIVE,
      ...overrides,
    }) as Character;

  const updateDto = (overrides: Partial<UpdateCharacterDto> = {}) =>
    ({
      real_name: 'Thor Odinson',
      alias: 'Thor',
      main_power: 'Mjolnir',
      power_level: 90,
      status: CharacterStatus.ACTIVE,
      is_villain: false,
      team_id: null,
      ...overrides,
    }) as UpdateCharacterDto;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: charactersRepo },
        { provide: TeamService, useValue: teamService },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  describe('create', () => {
    const dto = {
      real_name: 'Peter Parker',
      alias: 'Spider-Man',
      main_power: 'Spider sense',
      power_level: 70,
      status: CharacterStatus.ACTIVE,
      is_villain: false,
    };

    it('rejects a duplicated alias with 409', async () => {
      charactersRepo.findOneBy.mockResolvedValue(character({ id: 2 }));
      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('rejects an unknown team with 404', async () => {
      charactersRepo.findOneBy.mockResolvedValue(null);
      teamService.findOne.mockRejectedValue(new NotFoundException());
      await expect(service.create({ ...dto, team_id: 99 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects an inactive team with 400', async () => {
      charactersRepo.findOneBy.mockResolvedValue(null);
      teamService.findOne.mockResolvedValue({ id: 6, active: false });
      await expect(service.create({ ...dto, team_id: 6 })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('saves the character and returns it with its team', async () => {
      charactersRepo.findOneBy.mockResolvedValue(null);
      teamService.findOne.mockResolvedValue({ id: 1, active: true });
      const created = character({ id: 1, team_id: 1 });
      charactersRepo.findOne.mockResolvedValue(created);

      await expect(service.create({ ...dto, team_id: 1 })).resolves.toBe(
        created,
      );
      expect(charactersRepo.save).toHaveBeenCalledOnce();
      expect(charactersRepo.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: { team: true },
      });
    });
  });

  describe('findAll', () => {
    it('only filters by the query params that were sent', async () => {
      charactersRepo.find.mockResolvedValue([]);
      await service.findAll({ status: CharacterStatus.RETIRED });
      expect(charactersRepo.find).toHaveBeenCalledWith({
        where: { status: CharacterStatus.RETIRED },
        relations: { team: true },
        order: { id: 'ASC' },
      });
    });
  });

  describe('findOne', () => {
    it('throws 404 when the character does not exist', async () => {
      charactersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('allows keeping its own alias', async () => {
      charactersRepo.findOneBy.mockResolvedValue(character());
      charactersRepo.findOne.mockResolvedValue(character());
      await expect(service.update(1, updateDto())).resolves.toBeDefined();
    });

    it('rejects an alias used by another character with 409', async () => {
      charactersRepo.findOneBy
        .mockResolvedValueOnce(character())
        .mockResolvedValueOnce(character({ id: 2, alias: 'Hulk' }));
      await expect(
        service.update(1, updateDto({ alias: 'Hulk' })),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects RETIRED -> INJURED with 400', async () => {
      charactersRepo.findOneBy.mockResolvedValue(
        character({ status: CharacterStatus.RETIRED }),
      );
      await expect(
        service.update(1, updateDto({ status: CharacterStatus.INJURED })),
      ).rejects.toThrow(BadRequestException);
      expect(charactersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('rejects RETIRED -> INJURED with 400', async () => {
      charactersRepo.findOneBy.mockResolvedValue(
        character({ status: CharacterStatus.RETIRED }),
      );
      await expect(
        service.updateStatus(1, { status: CharacterStatus.INJURED }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows RETIRED -> ACTIVE', async () => {
      charactersRepo.findOneBy.mockResolvedValue(
        character({ status: CharacterStatus.RETIRED }),
      );
      charactersRepo.findOne.mockResolvedValue(character());
      await service.updateStatus(1, { status: CharacterStatus.ACTIVE });
      expect(charactersRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: CharacterStatus.ACTIVE }),
      );
    });
  });

  describe('remove', () => {
    it('throws 404 when the character does not exist', async () => {
      charactersRepo.findOneBy.mockResolvedValue(null);
      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      expect(charactersRepo.delete).not.toHaveBeenCalled();
    });
  });
});
