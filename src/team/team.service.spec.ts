import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { In } from 'typeorm';
import { TeamService } from './team.service.js';
import { Team } from './entities/team.entity.js';
import { Character } from '../characters/entities/character.entity.js';

describe('TeamService', () => {
  let service: TeamService;

  // create() guarda dentro de una transacción. Este es el "manager" falso que recibe.
  const manager = {
    create: vi.fn((_entity: unknown, data: object) => data),
    save: vi.fn((team: object) => ({ id: 10, ...team })),
    update: vi.fn(),
  };

  // Repositorios falsos: solo los métodos que TeamService realmente llama.
  const teamsRepo = {
    find: vi.fn(),
    findOneBy: vi.fn(),
    merge: vi.fn((team: object, dto: object) => ({ ...team, ...dto })),
    save: vi.fn(),
    delete: vi.fn(),
    // La transacción falsa solo ejecuta la función que le pasan, con el manager falso.
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

  // Regla 2 (nombre único) y regla 5 (personajes existen, equipo activo)
  describe('create · POST /teams', () => {
    it('crea el equipo cuando el nombre está libre', async () => {
      // Preparar
      teamsRepo.findOneBy
        .mockResolvedValueOnce(null) // 1.ª llamada: buscar por nombre (está libre)
        .mockResolvedValueOnce({ id: 10, name: 'Defenders' }); // 2.ª llamada: leer el equipo creado

      // Ejecutar
      const result = await service.create({ name: 'Defenders' });

      // Verificar
      expect(manager.save).toHaveBeenCalledOnce();
      expect(result).toEqual({ id: 10, name: 'Defenders' });
    });

    it('lanza 409 y no guarda si el nombre ya existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });

      await expect(service.create({ name: 'Avengers' })).rejects.toThrow(
        ConflictException,
      );
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('asigna al equipo los personajes enviados', async () => {
      teamsRepo.findOneBy
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 10, name: 'Defenders' });
      charactersRepo.findBy.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      await service.create({ name: 'Defenders', characterIds: [1, 2] });

      expect(manager.update).toHaveBeenCalledWith(
        Character,
        { id: In([1, 2]) },
        { team_id: 10 },
      );
    });

    it('lanza 404 y no guarda si algún personaje no existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);
      charactersRepo.findBy.mockResolvedValue([{ id: 1 }]); // el 99 no está

      await expect(
        service.create({ name: 'Defenders', characterIds: [1, 99] }),
      ).rejects.toThrow(NotFoundException);
      expect(manager.save).not.toHaveBeenCalled();
    });

    it('lanza 400 y no guarda si se asignan personajes a un equipo inactivo', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);

      await expect(
        service.create({ name: 'Defenders', active: false, characterIds: [1] }),
      ).rejects.toThrow(BadRequestException);
      expect(manager.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll · GET /teams', () => {
    it('devuelve los equipos ordenados por id', async () => {
      teamsRepo.find.mockResolvedValue([
        { id: 1, name: 'Avengers' },
        { id: 2, name: 'X-Men' },
      ]);

      const result = await service.findAll();

      expect(teamsRepo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
      expect(result).toHaveLength(2);
    });
  });

  // Regla 1 (404 si no existe)
  describe('findOne · GET /teams/:id', () => {
    it('devuelve el equipo cuando existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });

      const result = await service.findOne(1);

      expect(result).toEqual({ id: 1, name: 'Avengers' });
    });

    it('lanza 404 si el equipo no existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  // Regla 1 (404 si el equipo no existe)
  describe('findCharacters · GET /teams/:id/characters', () => {
    it('devuelve los personajes del equipo', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });
      charactersRepo.find.mockResolvedValue([{ id: 3, alias: 'Thor' }]);

      const result = await service.findCharacters(1);

      expect(charactersRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { team_id: 1 } }),
      );
      expect(result).toEqual([{ id: 3, alias: 'Thor' }]);
    });

    it('lanza 404 y no busca personajes si el equipo no existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue(null);

      await expect(service.findCharacters(99)).rejects.toThrow(
        NotFoundException,
      );
      expect(charactersRepo.find).not.toHaveBeenCalled();
    });
  });

  // Regla 2 (nombre único)
  describe('update · PUT /teams/:id', () => {
    it('permite conservar su propio nombre', async () => {
      // El único equipo con ese nombre es el mismo que se actualiza (id 1)
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });

      await service.update(1, {
        name: 'Avengers',
        base: 'Avengers Tower',
        founded_year: 1963,
        active: false,
      });

      expect(teamsRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: 1, active: false }),
      );
    });

    it('lanza 409 y no guarda si el nombre es de otro equipo', async () => {
      teamsRepo.findOneBy
        .mockResolvedValueOnce({ id: 1, name: 'Avengers' }) // 1.ª llamada: buscar el equipo por id
        .mockResolvedValueOnce({ id: 2, name: 'X-Men' }); // 2.ª llamada: buscar por nombre

      await expect(
        service.update(1, {
          name: 'X-Men',
          base: null,
          founded_year: null,
          active: true,
        }),
      ).rejects.toThrow(ConflictException);
      expect(teamsRepo.save).not.toHaveBeenCalled();
    });
  });

  // Regla 5 (personajes existen, equipo activo)
  describe('assignCharacters · PATCH /teams/:id/characters', () => {
    it('reasigna los personajes al equipo', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, active: true });
      charactersRepo.findBy.mockResolvedValue([{ id: 3 }]);

      await service.assignCharacters(1, { characterIds: [3] });

      expect(charactersRepo.update).toHaveBeenCalledWith(
        { id: In([3]) },
        { team_id: 1 },
      );
    });

    it('lanza 400 y no asigna si el equipo está inactivo', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 6, active: false });

      await expect(
        service.assignCharacters(6, { characterIds: [3] }),
      ).rejects.toThrow(BadRequestException);
      expect(charactersRepo.update).not.toHaveBeenCalled();
    });

    it('lanza 404 y no asigna si algún personaje no existe', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, active: true });
      charactersRepo.findBy.mockResolvedValue([]);

      await expect(
        service.assignCharacters(1, { characterIds: [99] }),
      ).rejects.toThrow(NotFoundException);
      expect(charactersRepo.update).not.toHaveBeenCalled();
    });
  });

  // Regla 6 (no se elimina un equipo con personajes)
  describe('remove · DELETE /teams/:id', () => {
    it('elimina un equipo sin personajes', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });
      charactersRepo.countBy.mockResolvedValue(0);

      await service.remove(1);

      expect(teamsRepo.delete).toHaveBeenCalledWith(1);
    });

    it('lanza 409 y no elimina un equipo con personajes', async () => {
      teamsRepo.findOneBy.mockResolvedValue({ id: 1, name: 'Avengers' });
      charactersRepo.countBy.mockResolvedValue(5);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(teamsRepo.delete).not.toHaveBeenCalled();
    });
  });
});
