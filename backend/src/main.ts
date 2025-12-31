import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({
    origin: true, // tighten in prod: your dashboard domain(s)
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
