import { Test, TestingModule } from '@nestjs/testing';
import { TeamController } from './team.controller.js';
import { TeamService } from './team.service.js';

describe('TeamController', () => {
  let controller: TeamController;
  // Aquí el mock es el servicio completo: el controlador solo delega.
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    findCharacters: vi.fn(),
    update: vi.fn(),
    assignCharacters: vi.fn(),
    remove: vi.fn(),
  };

  // Lo que devuelve el servicio: la entidad, con sus fechas.
  const avengers = {
    id: 1,
    name: 'Avengers',
    base: 'Avengers Tower',
    founded_year: 1963,
    active: true,
    created_at: new Date(),
    updated_at: new Date(),
  };
  // Lo que debe responder el controlador: el DTO, sin fechas.
  const avengersResponse = {
    id: 1,
    name: 'Avengers',
    base: 'Avengers Tower',
    founded_year: 1963,
    active: true,
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamController],
      providers: [{ provide: TeamService, useValue: service }],
    }).compile();

    controller = module.get<TeamController>(TeamController);
  });

  describe('create · POST /teams', () => {
    it('delega en el servicio y responde con el DTO', async () => {
      service.create.mockResolvedValue(avengers);
      const dto = { name: 'Avengers' };

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(avengersResponse);
    });
  });

  describe('findAll · GET /teams', () => {
    it('responde cada equipo con el DTO', async () => {
      service.findAll.mockResolvedValue([avengers]);

      const result = await controller.findAll();

      expect(result).toEqual([avengersResponse]);
    });
  });

  describe('findOne · GET /teams/:id', () => {
    it('delega en el servicio y responde con el DTO', async () => {
      service.findOne.mockResolvedValue(avengers);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      // toEqual verifica que las fechas no salieron en la respuesta
      expect(result).toEqual(avengersResponse);
    });
  });

  describe('findCharacters · GET /teams/:id/characters', () => {
    it('responde cada personaje con su equipo resumido', async () => {
      service.findCharacters.mockResolvedValue([
        {
          id: 3,
          real_name: 'Thor Odinson',
          alias: 'Thor',
          main_power: 'Thunder control',
          power_level: 95,
          status: 'ACTIVE',
          is_villain: false,
          team_id: 1,
          team: avengers,
          created_at: new Date(),
        },
      ]);

      const result = await controller.findCharacters(1);

      expect(service.findCharacters).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          id: 3,
          real_name: 'Thor Odinson',
          alias: 'Thor',
          main_power: 'Thunder control',
          power_level: 95,
          status: 'ACTIVE',
          is_villain: false,
          team: { id: 1, name: 'Avengers' },
        },
      ]);
    });
  });

  describe('update · PUT /teams/:id', () => {
    it('delega en el servicio con el id y el body, y responde con el DTO', async () => {
      service.update.mockResolvedValue(avengers);
      const dto = {
        name: 'Avengers',
        base: 'Avengers Tower',
        founded_year: 1963,
        active: true,
      };

      const result = await controller.update(1, dto);

      expect(service.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(avengersResponse);
    });
  });

  describe('assignCharacters · PATCH /teams/:id/characters', () => {
    it('delega en el servicio con el id y el body, y responde con el DTO', async () => {
      service.assignCharacters.mockResolvedValue(avengers);
      const dto = { characterIds: [3, 5] };

      const result = await controller.assignCharacters(1, dto);

      expect(service.assignCharacters).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(avengersResponse);
    });
  });

  describe('remove · DELETE /teams/:id', () => {
    it('delega en el servicio', async () => {
      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
