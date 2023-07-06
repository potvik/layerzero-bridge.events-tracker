import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OperationsMetricsService } from './op-metrics.service';

@ApiTags('tracker')
@Controller('tracker')
export class OperationsMetricsController {
  constructor(
    private readonly operationsMetricsService: OperationsMetricsService
  ) { }

  @Get('/info')
  getInfo() {
    return this.operationsMetricsService.getInfo();
  }
}
