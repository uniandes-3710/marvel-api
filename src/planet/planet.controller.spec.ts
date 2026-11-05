import { Test, TestingModule } from '@nestjs/testing';
import { PlanetController } from './planet.controller.js';
import { PlanetService } from './planet.service.js';

describe('PlanetController', () => {
  let controller: PlanetController;
  // El controlador solo delega: se prueba contra un servicio falso.
  const service = {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanetController],
      providers: [{ provide: PlanetService, useValue: service }],
    }).compile();

    controller = module.get<PlanetController>(PlanetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('create delega en el servicio con el body', () => {
    service.create.mockReturnValue('created');

    expect(controller.create({})).toBe('created');
    expect(service.create).toHaveBeenCalledWith({});
  });

  it('findAll delega en el servicio', () => {
    service.findAll.mockReturnValue('all');

    expect(controller.findAll()).toBe('all');
    expect(service.findAll).toHaveBeenCalledOnce();
  });

  // El id llega como texto en la ruta y el controlador lo convierte a número.
  it('findOne convierte el id a número', () => {
    controller.findOne('7');

    expect(service.findOne).toHaveBeenCalledWith(7);
  });

  it('update convierte el id a número y pasa el body', () => {
    controller.update('7', {});

    expect(service.update).toHaveBeenCalledWith(7, {});
  });

  it('remove convierte el id a número', () => {
    controller.remove('7');

    expect(service.remove).toHaveBeenCalledWith(7);
  });
});
