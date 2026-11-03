import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { TeamService } from './team.service.js';
import { Team } from './entities/team.entity.js';
import { Character } from '../characters/entities/character.entity.js';

describe('TeamService', () => {
  let service: TeamService;
  const manager = {
    create: vi.fn((_entity: unknown, data: object) => ({ ...data })),
    save: vi.fn((entity: object) => Promise.resolve({ id: 10, ...entity })),
    update: vi.fn(),
  };
  const teamsRepo = {
    find: vi.fn(),
    findOne: vi.fn(),
    findOneBy: vi.fn(),
    merge: vi.fn((entity: object, dto: object) => Object.assign(entity, dto)),
    save: vi.fn(),
    delete: vi.fn(),
    manager: {
      transaction: vi.fn((work: (m: typeof manager) => unknown) =>
        work(manager),
      ),
    },
  };
  const charactersRepo = {
    find: vi.fn(),
    findBy: vi.fn(),
    countBy: vi.fn(),
    update: vi.fn(),
  };

  const team = (overrides: Partial<Team> = {}) =>
    ({ id: 1, name: 'Avengers', active: true, ...overrides }) as Team;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        { provide: getRepositoryToken(Team), useValue: teamsRepo },
        { provide: getRepositoryToken(Character), useValue: charactersRepo },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  describe('create', () => {
    it('rejects a duplicated name with 409', async () => {
      teamsRepo.findOneBy.mockResolvedValue(team());
      await expect(service.create({ name: 'Avengers' })).rejects.toThrow(
        ConflictException,
      );
    });

    it('rejects characterIds that do not exist with 404', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);
      charactersRepo.findBy.mockResolvedValue([{ id: 1 }]);
      await expect(
        service.create({ name: 'New', characterIds: [1, 99] }),
      ).rejects.toThrow(
        new NotFoundException('No existen los personajes con id: 99'),
      );
      expect(teamsRepo.manager.transaction).not.toHaveBeenCalled();
    });

    it('rejects assigning characters to an inactive team with 400', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);
      await expect(
        service.create({ name: 'New', active: false, characterIds: [1] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates the team and assigns its characters in one transaction', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);
      charactersRepo.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      teamsRepo.findOne.mockResolvedValue(team({ id: 10 }));

      await service.create({ name: 'New', characterIds: [1, 2] });

      expect(manager.save).toHaveBeenCalledWith({ name: 'New' });
      expect(manager.update).toHaveBeenCalledWith(
        Character,
        expect.anything(),
        { team_id: 10 },
      );
    });
  });

  describe('findOne', () => {
    it('throws 404 when the team does not exist', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { name: 'X-Men', base: null, founded_year: null, active: true };

    it('rejects a name used by another team with 409', async () => {
      teamsRepo.findOneBy
        .mockResolvedValueOnce(team())
        .mockResolvedValueOnce(team({ id: 2, name: 'X-Men' }));
      await expect(service.update(1, dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('assignCharacters', () => {
    it('rejects an inactive team with 400', async () => {
      teamsRepo.findOneBy.mockResolvedValue(team({ active: false }));
      await expect(
        service.assignCharacters(1, { characterIds: [1] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('reassigns the characters to the team', async () => {
      teamsRepo.findOneBy.mockResolvedValue(team());
      charactersRepo.findBy.mockResolvedValue([{ id: 6 }]);
      teamsRepo.findOne.mockResolvedValue(team());

      await service.assignCharacters(1, { characterIds: [6] });
      expect(charactersRepo.update).toHaveBeenCalledWith(expect.anything(), {
        team_id: 1,
      });
    });
  });

  describe('remove', () => {
    it('rejects a team with characters with 409', async () => {
      teamsRepo.findOneBy.mockResolvedValue(team());
      charactersRepo.countBy.mockResolvedValue(5);
      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(teamsRepo.delete).not.toHaveBeenCalled();
    });

    it('deletes a team without characters', async () => {
      teamsRepo.findOneBy.mockResolvedValue(team());
      charactersRepo.countBy.mockResolvedValue(0);
      await service.remove(1);
      expect(teamsRepo.delete).toHaveBeenCalledWith(1);
    });
  });
});
