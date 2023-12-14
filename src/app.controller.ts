import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import {
  HealthCheckService,
  HttpHealthIndicator,
  HealthCheck,
  MongooseHealthIndicator,
  DiskHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { AppService } from './app.service';

@Controller('v1')
export class AppController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: MongooseHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private appService: AppService,
  ) {}

  @Get('health/http-health')
  @HealthCheck()
  async httpHealth() {
    return this.health.check([
      () => this.http.pingCheck('Twinger-core-docs', 'https://www.google.com/'),
    ]);
  }

  @Get('health/mongoose-health')
  @HealthCheck()
  mongooseHealth() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }

  @Get('health/disk-health')
  @HealthCheck()
  diskHealth() {
    return this.health.check([
      () =>
        this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.5 }),
    ]);
  }

  @Get('health/memory-health')
  @HealthCheck()
  memoryHealth() {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
    ]);
  }

  @Get('health/check-health')
  async checkHealth() {
    try {
      return await this.appService.getHello();
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('health/check-http-exception-filter')
  async checkHttpExceptionFilter() {
    throw new HttpException(
      { message: 'Http Exception' },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
