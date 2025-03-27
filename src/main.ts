import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CloudErrorFilter } from './util/filter/cloud-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(new CloudErrorFilter());
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
