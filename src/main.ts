import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';
import { QueryFailedFilter } from './common/filters/query-failed.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Se activa una vez para toda la API. Sin esto, los decoradores de los DTOs no hacen nada.
  app.useGlobalPipes(
    new ValidationPipe({
      // Elimina del cuerpo los campos que no están en el DTO.
      whitelist: true,
      // En vez de eliminarlos, responde 400. Así el cliente se entera.
      forbidNonWhitelisted: true,
      // Convierte el JSON en una instancia del DTO y ajusta los tipos cuando puede.
      transform: true,
    }),
  );
  // Red de seguridad: los errores de restricciones de Postgres responden 409/400 y no 500.
  app.useGlobalFilters(new QueryFailedFilter());

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
