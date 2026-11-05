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

describe('CharactersService', () => {
  let service: CharactersService;

  // Repositorio falso: solo los métodos que CharactersService realmente llama.
  const repo = {
    find: vi.fn(),
    findOne: vi.fn(), // findOne(id): busca con su equipo
    findOneBy: vi.fn(), // buscar por alias, y por id en update, updateStatus y remove
    create: vi.fn((data: object) => data),
    merge: vi.fn((character: object, dto: object) => ({
      ...character,
      ...dto,
    })),
    save: vi.fn((character: object) => ({ id: 1, ...character })),
    delete: vi.fn(),
  };
  const teamService = { findOne: vi.fn() };

  // Body válido para crear o reemplazar un personaje.
  const spiderMan = {
    real_name: 'Peter Parker',
    alias: 'Spider-Man',
    main_power: 'Spider sense',
    power_level: 70,
    status: CharacterStatus.ACTIVE,
    is_villain: false,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getRepositoryToken(Character), useValue: repo },
        { provide: TeamService, useValue: teamService },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Regla 2 (alias único) y regla 4 (el equipo existe y está activo)
  describe('create · POST /characters', () => {
    it('crea el personaje cuando el alias está libre y lo devuelve con su equipo', async () => {
      // Preparar
      repo.findOneBy.mockResolvedValue(null); // el alias está libre
      repo.findOne.mockResolvedValue({ id: 1, ...spiderMan, team: null });

      // Ejecutar
      const result = await service.create(spiderMan);

      // Verificar
      expect(repo.save).toHaveBeenCalledWith(spiderMan);
      expect(repo.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 1 } }),
      );
      expect(result).toEqual({ id: 1, ...spiderMan, team: null });
      // Sin team_id no hay equipo que validar
      expect(teamService.findOne).not.toHaveBeenCalled();
    });

    it('lanza 409 y no guarda si el alias ya existe', async () => {
      repo.findOneBy.mockResolvedValue({ id: 5, alias: 'Spider-Man' });

      await expect(service.create(spiderMan)).rejects.toThrow(
        ConflictException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('crea el personaje en un equipo activo', async () => {
      repo.findOneBy.mockResolvedValue(null);
      teamService.findOne.mockResolvedValue({ id: 1, active: true });
      repo.findOne.mockResolvedValue({ id: 1, ...spiderMan, team_id: 1 });

      await service.create({ ...spiderMan, team_id: 1 });

      expect(teamService.findOne).toHaveBeenCalledWith(1);
      expect(repo.save).toHaveBeenCalledOnce();
    });

    it('lanza 404 y no guarda si el equipo no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);
      // El 404 lo lanza TeamService
      teamService.findOne.mockRejectedValue(new NotFoundException());

      await expect(
        service.create({ ...spiderMan, team_id: 99 }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza 400 y no guarda si el equipo está inactivo', async () => {
      repo.findOneBy.mockResolvedValue(null);
      teamService.findOne.mockResolvedValue({
        id: 6,
        name: 'Thunderbolts',
        active: false,
      });

      await expect(
        service.create({ ...spiderMan, team_id: 6 }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll · GET /characters', () => {
    it('sin filtros busca todos los personajes con su equipo', async () => {
      repo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await service.findAll({});

      expect(repo.find).toHaveBeenCalledWith({
        where: {},
        relations: { team: true },
        order: { id: 'ASC' },
      });
      expect(result).toHaveLength(2);
    });

    it('aplica los filtros de status y teamId', async () => {
      repo.find.mockResolvedValue([]);

      await service.findAll({ status: CharacterStatus.INJURED, teamId: 2 });

      expect(repo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: CharacterStatus.INJURED, team_id: 2 },
        }),
      );
    });
  });

  // Regla 1 (404 si no existe)
  describe('findOne · GET /characters/:id', () => {
    it('devuelve el personaje con su equipo', async () => {
      const thor = { id: 3, alias: 'Thor', team: { id: 1, name: 'Avengers' } };
      repo.findOne.mockResolvedValue(thor);

      const result = await service.findOne(3);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: 3 },
        relations: { team: true },
      });
      expect(result).toEqual(thor);
    });

    it('lanza 404 si el personaje no existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Reglas 1, 2, 4 y 7
  describe('update · PUT /characters/:id', () => {
    const current = { id: 1, ...spiderMan, team_id: null };

    it('reemplaza el personaje y permite conservar su propio alias', async () => {
      // El único personaje con ese alias es el mismo que se actualiza (id 1)
      repo.findOneBy.mockResolvedValue(current);
      repo.findOne.mockResolvedValue({ ...current, power_level: 80 });

      const result = await service.update(1, {
        ...spiderMan,
        power_level: 80,
        team_id: null,
      });

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, power_level: 80 }),
      );
      expect(result).toEqual(expect.objectContaining({ power_level: 80 }));
      // team_id null deja al personaje sin equipo: no hay equipo que validar
      expect(teamService.findOne).not.toHaveBeenCalled();
    });

    it('lanza 404 y no guarda si el personaje no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.update(99, { ...spiderMan, team_id: null }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza 409 y no guarda si el alias es de otro personaje', async () => {
      repo.findOneBy
        .mockResolvedValueOnce(current) // 1.ª llamada: buscar el personaje por id
        .mockResolvedValueOnce({ id: 2, alias: 'Iron Man' }); // 2.ª llamada: buscar por alias

      await expect(
        service.update(1, { ...spiderMan, alias: 'Iron Man', team_id: null }),
      ).rejects.toThrow(ConflictException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza 400 y no guarda si el equipo está inactivo', async () => {
      repo.findOneBy.mockResolvedValue(current);
      teamService.findOne.mockResolvedValue({
        id: 6,
        name: 'Thunderbolts',
        active: false,
      });

      await expect(
        service.update(1, { ...spiderMan, team_id: 6 }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('lanza 400 y no guarda si pasa de RETIRED a INJURED', async () => {
      repo.findOneBy.mockResolvedValue({
        ...current,
        status: CharacterStatus.RETIRED,
      });

      await expect(
        service.update(1, {
          ...spiderMan,
          status: CharacterStatus.INJURED,
          team_id: null,
        }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // Regla 1 (404) y regla 7 (RETIRED no pasa a INJURED)
  describe('updateStatus · PATCH /characters/:id/status', () => {
    it('lanza 400 y no guarda si pasa de RETIRED a INJURED', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 1,
        status: CharacterStatus.RETIRED,
      });

      await expect(
        service.updateStatus(1, { status: CharacterStatus.INJURED }),
      ).rejects.toThrow(BadRequestException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('permite pasar de RETIRED a ACTIVE', async () => {
      repo.findOneBy.mockResolvedValue({
        id: 1,
        status: CharacterStatus.RETIRED,
      });
      repo.findOne.mockResolvedValue({ id: 1, status: CharacterStatus.ACTIVE });

      const result = await service.updateStatus(1, {
        status: CharacterStatus.ACTIVE,
      });

      expect(repo.save).toHaveBeenCalledWith({
        id: 1,
        status: CharacterStatus.ACTIVE,
      });
      expect(result).toEqual({ id: 1, status: CharacterStatus.ACTIVE });
    });

    it('lanza 404 y no guarda si el personaje no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(
        service.updateStatus(99, { status: CharacterStatus.ACTIVE }),
      ).rejects.toThrow(NotFoundException);
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  // Regla 1 (404 si no existe)
  describe('remove · DELETE /characters/:id', () => {
    it('elimina el personaje', async () => {
      repo.findOneBy.mockResolvedValue({ id: 1 });

      await service.remove(1);

      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('lanza 404 y no elimina si el personaje no existe', async () => {
      repo.findOneBy.mockResolvedValue(null);

      await expect(service.remove(99)).rejects.toThrow(NotFoundException);
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });
});
