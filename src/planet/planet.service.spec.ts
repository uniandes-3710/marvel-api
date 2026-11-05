import { Test, TestingModule } from '@nestjs/testing';
import { PlanetService } from './planet.service.js';

describe('PlanetService', () => {
  let service: PlanetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanetService],
    }).compile();

    service = module.get<PlanetService>(PlanetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // El servicio aún es el esqueleto que genera Nest: cada método responde un texto.
  it('create', () => {
    expect(service.create({})).toBe('This action adds a new planet');
  });

  it('findAll', () => {
    expect(service.findAll()).toBe('This action returns all planet');
  });

  it('findOne', () => {
    expect(service.findOne(1)).toBe('This action returns a #1 planet');
  });

  it('update', () => {
    expect(service.update(1, {})).toBe('This action updates a #1 planet');
  });

  it('remove', () => {
    expect(service.remove(1)).toBe('This action removes a #1 planet');
  });
});
