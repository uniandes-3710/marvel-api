import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { CharactersController } from './../src/characters/characters.controller.js';
import { CharactersService } from './../src/characters/characters.service.js';
import { TeamController } from './../src/team/team.controller.js';
import { TeamService } from './../src/team/team.service.js';

// Exercises the request pipeline (ValidationPipe + ParseIntPipe) with the
// services mocked, so it runs without a database.
describe('Request validation (e2e)', () => {
  let app: INestApplication<App>;
  const charactersService = {
    create: vi.fn().mockResolvedValue({ id: 1 }),
    findAll: vi.fn().mockResolvedValue([]),
    updateStatus: vi.fn().mockResolvedValue({ id: 1 }),
  };
  const teamService = {
    create: vi.fn().mockResolvedValue({ id: 1 }),
    assignCharacters: vi.fn().mockResolvedValue({ id: 1 }),
  };

  const validCharacter = {
    real_name: 'Peter Parker',
    alias: 'Spider-Man',
    main_power: 'Spider sense',
    power_level: 70,
    status: 'ACTIVE',
    is_villain: false,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController, TeamController],
      providers: [
        { provide: CharactersService, useValue: charactersService },
        { provide: TeamService, useValue: teamService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    // Mismo pipe que main.ts.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => vi.clearAllMocks());

  afterAll(async () => {
    await app.close();
  });

  it('POST /characters accepts a valid body with 201', async () => {
    await request(app.getHttpServer())
      .post('/characters')
      .send(validCharacter)
      .expect(201);
    expect(charactersService.create).toHaveBeenCalledWith(validCharacter);
  });

  it.each([
    ['power_level above 100', { power_level: 101 }],
    ['power_level below 1', { power_level: 0 }],
    ['an unknown status', { status: 'DEAD' }],
    ['an empty alias', { alias: '' }],
    ['an unknown property', { secret: true }],
  ])('POST /characters rejects %s with 400', async (_, override) => {
    await request(app.getHttpServer())
      .post('/characters')
      .send({ ...validCharacter, ...override })
      .expect(400);
    expect(charactersService.create).not.toHaveBeenCalled();
  });

  it('GET /characters converts teamId to a number', async () => {
    await request(app.getHttpServer())
      .get('/characters?status=ACTIVE&teamId=2')
      .expect(200);
    expect(charactersService.findAll).toHaveBeenCalledWith({
      status: 'ACTIVE',
      teamId: 2,
    });
  });

  it('GET /characters rejects an unknown status filter with 400', () => {
    return request(app.getHttpServer())
      .get('/characters?status=FOO')
      .expect(400);
  });

  it('PATCH /characters/:id/status rejects a non numeric id with 400', () => {
    return request(app.getHttpServer())
      .patch('/characters/abc/status')
      .send({ status: 'ACTIVE' })
      .expect(400);
  });

  it('PATCH /characters/:id/status passes the id as a number', async () => {
    await request(app.getHttpServer())
      .patch('/characters/3/status')
      .send({ status: 'INJURED' })
      .expect(200);
    expect(charactersService.updateStatus).toHaveBeenCalledWith(3, {
      status: 'INJURED',
    });
  });

  it('POST /teams rejects founded_year out of range with 400', () => {
    return request(app.getHttpServer())
      .post('/teams')
      .send({ name: 'New', founded_year: 1800 })
      .expect(400);
  });

  it('PATCH /teams/:id/characters rejects an empty list with 400', () => {
    return request(app.getHttpServer())
      .patch('/teams/1/characters')
      .send({ characterIds: [] })
      .expect(400);
  });
});
