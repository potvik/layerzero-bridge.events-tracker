import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TransferTrackerService } from './transfer-tracker.service';

@ApiTags('tracker')
@Controller('tracker')
export class TransferTrackerController {
  constructor(
    private readonly trackerService: TransferTrackerService
  ) { }

  @Get('/info')
  getInfo() {
    return this.trackerService.getInfo();
  }

  @Get('/events')
  getEvents(@Query() query: any) {
    return this.trackerService.getEvents(query);
  }
}
