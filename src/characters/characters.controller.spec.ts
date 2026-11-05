import { Test, TestingModule } from '@nestjs/testing';
import { CharactersController } from './characters.controller.js';
import { CharactersService } from './characters.service.js';
import { CharacterStatus } from './enums/character-status.enum.js';

describe('CharactersController', () => {
  let controller: CharactersController;
  // Aquí el mock es el servicio completo: el controlador solo delega.
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    updateStatus: vi.fn(),
    remove: vi.fn(),
  };

  // Body válido para crear o reemplazar un personaje.
  const thorBody = {
    real_name: 'Thor Odinson',
    alias: 'Thor',
    main_power: 'Thunder control',
    power_level: 95,
    status: CharacterStatus.ACTIVE,
    is_villain: false,
  };
  // Lo que devuelve el servicio: la entidad, con su equipo completo y sus fechas.
  const thor = {
    id: 3,
    ...thorBody,
    team_id: 1,
    team: {
      id: 1,
      name: 'Avengers',
      base: 'Avengers Tower',
      founded_year: 1963,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
    created_at: new Date(),
    updated_at: new Date(),
  };
  // Lo que debe responder el controlador: el DTO, sin fechas ni team_id
  // y con el equipo resumido.
  const thorResponse = {
    id: 3,
    ...thorBody,
    team: { id: 1, name: 'Avengers' },
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [{ provide: CharactersService, useValue: service }],
    }).compile();

    controller = module.get<CharactersController>(CharactersController);
  });

  describe('create · POST /characters', () => {
    it('delega en el servicio y responde con el DTO', async () => {
      service.create.mockResolvedValue(thor);
      const dto = { ...thorBody, team_id: 1 };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(thorResponse);
    });
  });

  describe('findAll · GET /characters', () => {
    it('pasa los filtros al servicio y responde cada personaje con el DTO', async () => {
      service.findAll.mockResolvedValue([thor]);

      const result = await controller.findAll(CharacterStatus.ACTIVE, 1);

      expect(service.findAll).toHaveBeenCalledWith({
        status: CharacterStatus.ACTIVE,
        teamId: 1,
      });
      expect(result).toEqual([thorResponse]);
    });

    it('sin filtros los pasa como undefined', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith({
        status: undefined,
        teamId: undefined,
      });
      expect(result).toEqual([]);
    });
  });

  describe('findOne · GET /characters/:id', () => {
    it('delega en el servicio y responde con el DTO', async () => {
      service.findOne.mockResolvedValue(thor);

      const result = await controller.findOne(3);

      expect(service.findOne).toHaveBeenCalledWith(3);
      // toEqual verifica que las fechas no salieron en la respuesta
      expect(result).toEqual(thorResponse);
    });

    it('responde team: null si el personaje no tiene equipo', async () => {
      service.findOne.mockResolvedValue({ ...thor, team_id: null, team: null });

      const result = await controller.findOne(3);

      expect(result).toEqual({ ...thorResponse, team: null });
    });
  });

  describe('update · PUT /characters/:id', () => {
    it('delega en el servicio con el id y el body, y responde con el DTO', async () => {
      service.update.mockResolvedValue(thor);
      const dto = { ...thorBody, team_id: 1 };

      const result = await controller.update(3, dto);

      expect(service.update).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual(thorResponse);
    });
  });

  describe('updateStatus · PATCH /characters/:id/status', () => {
    it('delega en el servicio con el id y el body, y responde con el DTO', async () => {
      service.updateStatus.mockResolvedValue({
        ...thor,
        status: CharacterStatus.INJURED,
      });
      const dto = { status: CharacterStatus.INJURED };

      const result = await controller.updateStatus(3, dto);

      expect(service.updateStatus).toHaveBeenCalledWith(3, dto);
      expect(result).toEqual({
        ...thorResponse,
        status: CharacterStatus.INJURED,
      });
    });
  });

  describe('remove · DELETE /characters/:id', () => {
    it('delega en el servicio', async () => {
      await controller.remove(3);

      expect(service.remove).toHaveBeenCalledWith(3);
    });
  });
});
