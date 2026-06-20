import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
    // This server is an API + embed-asset host (vck.js) + demo/test pages.
    // Its own CSP would block the embed's inline styles and the test pages'
    // inline scripts; the CSP that matters in production is the merchant
    // storefront's, not this origin. So disable CSP here.
    contentSecurityPolicy: false,
  }));
  app.enableCors({
    origin: true, // tighten in prod: your dashboard domain(s)
    credentials: true,
  });

  await app.listen(process.env.PORT || 3001);
}
bootstrap();
