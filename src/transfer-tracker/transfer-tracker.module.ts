import { Module } from '@nestjs/common';
import { TransferTrackerService } from './transfer-tracker.service';
import { ConfigModule } from '@nestjs/config';
import { TransferTrackerController } from './transfer-tracker.controller';
import { Transfers } from 'src/typeorm';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Transfers]),
  ],
  providers: [TransferTrackerService],
  exports: [TransferTrackerService],
  controllers: [TransferTrackerController],
})
export class TransferTrackerModule {}
