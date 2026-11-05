import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CharactersService } from './characters.service.js';
import { Character } from './entities/character.entity.js';
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

  // En clase: una prueba por regla, un caso que la cumple y uno que la rompe.
  // - Regla 1 · findOne: 404 si el personaje no existe
  // - Regla 2 · create: 409 y no guarda si el alias ya existe · crea si está libre
  // - Regla 4 · create: 404 si el equipo no existe · 400 si está inactivo
  // - Regla 7 · updateStatus: 400 de RETIRED a INJURED · sí de RETIRED a ACTIVE
});
