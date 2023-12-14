import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import fastifyRateLimit from '@fastify/rate-limit';
import fastifyHelmet from '@fastify/helmet';
import fastifyCompress from '@fastify/compress';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import mongoose from 'mongoose';

const swaggerDocument = new DocumentBuilder()
  .setTitle('DATN FALL 2023 BACKEND')
  .setDescription('Build by Vietnt')
  .setVersion('0.0.2')
  .addBearerAuth()
  .build();

const customOptions: SwaggerCustomOptions = {
  swaggerOptions: {
    persistAuthorization: true,
  },
  customSiteTitle: 'Backend Booking Movie API Docs',
};

if (process.env.NODE_ENV !== 'production') mongoose.set('debug', true);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
      },
      reportOnly: true,
    },
  });

  await app.register(fastifyCompress, { encodings: ['gzip', 'deflate'] });

  await app.register(fastifyRateLimit, {
    max: 100,
    timeWindow: 6000,
  });

  await app.register(fastifyCors, {
    // put your options here
  });

  await app.register(fastifyMultipart, {
    limits: {
      fieldNameSize: 100000, // Max field name size in bytes
      fieldSize: 10000000, // Max field value size in bytes
      fields: 10, // Max number of non-file fields
      fileSize: 10000000, // For multipart forms, the max file size in bytes
      files: 100, // Max number of file fields
      headerPairs: 200000, // Max number of header key=>value pairs
    },
  });

  const configService = app.get(ConfigService);
  app.setGlobalPrefix(`${configService.get('base.prefix')}`);

  const document = SwaggerModule.createDocument(app, swaggerDocument);
  fs.writeFileSync('./swagger-spec.json', JSON.stringify(document));
  SwaggerModule.setup(process.env.PREFIX_SWAGGER, app, document, customOptions);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.listen(configService.get('base.port') || 3000, '0.0.0.0');
}
bootstrap();
