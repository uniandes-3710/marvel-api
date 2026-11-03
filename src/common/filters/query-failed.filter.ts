import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import type { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Red de seguridad para violaciones de restricciones que pasan los chequeos de los servicios,
// p. ej. dos peticiones que crean el mismo alias a la vez. Sin él responderían 500.
@Catch(QueryFailedError)
export class QueryFailedFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const error = toHttpException(exception);
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(error.getStatus())
      .json(error.getResponse());
  }
}

// Códigos de error de Postgres: https://www.postgresql.org/docs/current/errcodes-appendix.html
function toHttpException(exception: QueryFailedError): HttpException {
  const { code } = exception.driverError as { code?: string };
  switch (code) {
    case '23505': // unique_violation
      return new ConflictException(
        'Ya existe un registro con ese mismo valor único',
      );
    case '23503': // foreign_key_violation
      return new ConflictException(
        'La operación choca con registros relacionados',
      );
    case '23514': // check_violation
    case '22P02': // invalid_text_representation
      return new BadRequestException(
        'Los datos no cumplen una restricción de la base',
      );
    default:
      return new InternalServerErrorException();
  }
}
