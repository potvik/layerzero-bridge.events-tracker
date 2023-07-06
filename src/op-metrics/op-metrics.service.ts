import { Injectable, Logger } from '@nestjs/common';
import { Counter } from "prom-client";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { DBService, NETWORK_TYPE, OPERATION_TYPE, STATUS } from './database';

enum CHAIN {
  BSC = 'bsc',
  ETH = 'eth',
  HMY = 'hmy',
}

@Injectable()
export class OperationsMetricsService {
  private readonly logger = new Logger(OperationsMetricsService.name);
  private database: DBService;
  private syncInterval = 1000 * 60;

  constructor(
    @InjectMetric("operations_hmy_to_eth_success_count") public hmyToEthSuccessCount: Counter<string>,
    @InjectMetric("operations_hmy_to_bsc_success_count") public hmyToBscSuccessCount: Counter<string>,
    @InjectMetric("operations_hmy_to_arb_success_count") public hmyToArbSuccessCount: Counter<string>,
    @InjectMetric("operations_eth_to_hmy_success_count") public ethToHmySuccessCount: Counter<string>,
    @InjectMetric("operations_bsc_to_hmy_success_count") public bscToHmySuccessCount: Counter<string>,
    @InjectMetric("operations_arb_to_hmy_success_count") public arbToHmySuccessCount: Counter<string>,
  ) {
    this.database = new DBService();

    this.updateCounters();
  }

  updateCounterByConfig = async (params: {
    counter: Counter<string>;
    type: OPERATION_TYPE;
    network: NETWORK_TYPE;
    status: STATUS;
  }) => {
    const { counter, type, network, status } = params;

    const newCount = await this.database.getOperationsCount({ type, network, status });

    const lastCount = (await counter.get()).values[0].value;

    counter.inc(newCount - lastCount);
  }

  updateCounters = async () => {
    try {
      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ONE_ETH,
        network: NETWORK_TYPE.ETHEREUM,
        status: STATUS.SUCCESS,
        counter: this.hmyToEthSuccessCount
      })

      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ONE_ETH,
        network: NETWORK_TYPE.BINANCE,
        status: STATUS.SUCCESS,
        counter: this.hmyToBscSuccessCount
      })

      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ONE_ETH,
        network: NETWORK_TYPE.ARBITRUM,
        status: STATUS.SUCCESS,
        counter: this.hmyToArbSuccessCount
      })

      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ETH_ONE,
        network: NETWORK_TYPE.ETHEREUM,
        status: STATUS.SUCCESS,
        counter: this.ethToHmySuccessCount
      })

      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ETH_ONE,
        network: NETWORK_TYPE.BINANCE,
        status: STATUS.SUCCESS,
        counter: this.bscToHmySuccessCount
      })

      await this.updateCounterByConfig({
        type: OPERATION_TYPE.ETH_ONE,
        network: NETWORK_TYPE.ARBITRUM,
        status: STATUS.SUCCESS,
        counter: this.arbToHmySuccessCount
      })
    } catch (e) {
      this.logger.error('updateCounters error', e);
    }

    setTimeout(this.updateCounters, this.syncInterval);
  }

  getInfo() {
    return null;
  }
}