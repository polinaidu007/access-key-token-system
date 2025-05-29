import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  SwaggerModule,
  DocumentBuilder,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Token Validation Service')
    .setDescription('L2 Service for Access Key Validation and Rate Limiting')
    .setVersion('1.0')
    .addTag('token')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document)

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
