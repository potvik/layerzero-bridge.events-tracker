import { Module } from '@nestjs/common';
import { OperationsMetricsService } from './op-metrics.service';
import { ConfigModule } from '@nestjs/config';
import { OperationsMetricsController } from './op-metrics.controller';
import { makeCounterProvider } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    ConfigModule,
  ],
  providers: [
    OperationsMetricsService,
    makeCounterProvider({
      name: "operations_hmy_to_eth_success_count",
      help: "Harmony to Ethereum success operations count",
    }),
    makeCounterProvider({
      name: "operations_hmy_to_bsc_success_count",
      help: "Harmony to Bsc success operations count",
    }),
    makeCounterProvider({
      name: "operations_hmy_to_arb_success_count",
      help: "Harmony to Arbitrum success operations count",
    }),
    makeCounterProvider({
      name: "operations_eth_to_hmy_success_count",
      help: "Ethereum to Harmony success operations count",
    }),
    makeCounterProvider({
      name: "operations_bsc_to_hmy_success_count",
      help: "Bsc to Harmony success operations count",
    }),
    makeCounterProvider({
      name: "operations_arb_to_hmy_success_count",
      help: "Arbitrum to Harmony success operations count",
    }),
  ],
  exports: [OperationsMetricsService],
  controllers: [OperationsMetricsController],
})
export class OperationsMetricsModule { }