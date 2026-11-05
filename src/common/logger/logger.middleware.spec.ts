import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { LoggerMiddleware } from './logger.middleware.js';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let log: ReturnType<typeof vi.spyOn>;

  // Respuesta falsa: guarda el callback de 'finish' para dispararlo a mano.
  let onFinish: () => void;
  const on = vi.fn((event: string, cb: () => void) => {
    if (event === 'finish') onFinish = cb;
  });
  const res = { statusCode: 200, on } as unknown as Response;
  const req = { method: 'GET', originalUrl: '/characters?status=ACTIVE' };
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    middleware = new LoggerMiddleware();
    // Evita que el log salga en la consola de las pruebas.
    log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    log.mockRestore();
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  it('deja pasar la petición sin escribir el log todavía', () => {
    middleware.use(req as Request, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(on).toHaveBeenCalledWith('finish', expect.any(Function));
    expect(log).not.toHaveBeenCalled();
  });

  it('al terminar la respuesta registra método, ruta, código y duración', () => {
    middleware.use(req as Request, res, next);

    onFinish();

    expect(log).toHaveBeenCalledWith(
      expect.stringMatching(/^GET \/characters\?status=ACTIVE 200 \d+ms$/),
    );
  });
});
