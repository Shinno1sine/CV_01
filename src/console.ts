import { Logger } from '@nestjs/common';
import { BootstrapConsole } from 'nestjs-console';
import { AppModule } from './app.module';

const bootstrap = new BootstrapConsole({
  module: AppModule,
  useDecorators: true,
});

bootstrap.init().then(async (app) => {
  try {
    await app.init();
    await bootstrap.boot();
    await app.close();
  } catch (error) {
    Logger.error('🚀 ~ bootstrap.init ~ error', error);
    await app.close();
    process.exit(1);
  }
});
