import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventTrackerService } from 'src/event-tracker/event-tracker.service';
import { abi } from '../abi';
import { Web3Service } from "nest-web3";
import { InjectRepository } from '@nestjs/typeorm';
import { Transfers } from 'src/typeorm';
import { Repository } from 'typeorm';
import { parseTx } from './helpers';

export interface IBridgeEvent {
  transactionHash: string;
  blockNumber: number;
  srcChainId: string;
  srcUaAddress: string;
  dstUaAddress: string;
  srcUaNonce: string;
  payloadHash: string;
  from: string;
  to: string;
  amount: string;
  dstChainId: string;
}

enum CHAIN {
  BSC = 'bsc',
  ETH = 'eth',
  HMY = 'hmy',
}

interface IEventFilterParams extends IBridgeEvent {
  chain: CHAIN
}

@Injectable()
export class TransferTrackerService {
  private readonly logger = new Logger(TransferTrackerService.name);

  private hmyEventTracker: EventTrackerService;
  private bscEventTracker: EventTrackerService;
  private ethEventTracker: EventTrackerService;

  events: Record<CHAIN, IBridgeEvent[]> = {
    [CHAIN.BSC]: [],
    [CHAIN.ETH]: [],
    [CHAIN.HMY]: [],
  }

  constructor(
    private configService: ConfigService,
    private readonly web3Service: Web3Service,
    @InjectRepository(Transfers)
    private transfersRep: Repository<Transfers>,
  ) {
    this.bscEventTracker = new EventTrackerService({
      chain: CHAIN.BSC,
      web3: this.web3Service.getClient(CHAIN.BSC),
      contractAbi: abi,
      contractAddress: this.configService.get(CHAIN.BSC).contract,
      eventName: 'PacketReceived',
      getEventCallback: async (res) => {
        if (res?.name === 'PacketReceived' && res?.returnValues?.srcChainId == '116') {
          const event = await parseTx(res.transactionHash, web3Service.getClient(CHAIN.BSC));
          this.events[CHAIN.BSC].push({ ...event, dstChainId: '102' });
        }
      }
    });

    this.bscEventTracker.start();

    this.ethEventTracker = new EventTrackerService({
      chain: CHAIN.ETH,
      web3: this.web3Service.getClient(CHAIN.ETH),
      contractAbi: abi,
      contractAddress: this.configService.get(CHAIN.ETH).contract,
      eventName: 'PacketReceived',
      getEventCallback: async (res) => {
        if (res?.name === 'PacketReceived' && res?.returnValues?.srcChainId == '116') {
          const event = await parseTx(res.transactionHash, web3Service.getClient(CHAIN.ETH));
          this.events[CHAIN.ETH].push({ ...event, dstChainId: '101' });
        }
      }
    });

    this.ethEventTracker.start();

    this.hmyEventTracker = new EventTrackerService({
      chain: CHAIN.HMY,
      web3: this.web3Service.getClient(CHAIN.HMY),
      contractAbi: abi,
      contractAddress: this.configService.get(CHAIN.HMY).contract,
      eventName: 'PacketReceived',
      getEventCallback: async (res) => {
        if (res?.name === 'PacketReceived') {
          const event = await parseTx(res.transactionHash, web3Service.getClient(CHAIN.HMY));
          this.events[CHAIN.HMY].push({ ...event, dstChainId: '116' });
        }
      }
    });

    this.hmyEventTracker.start();
  }

  async getTransfers() {
    return await this.transfersRep.findAndCount({ take: 100 });
  }

  getInfo = () => {
    return {
      bsc: {
        info: this.bscEventTracker.getInfo(),
        events: this.events[CHAIN.BSC].length,
      },
      eth: {
        info: this.ethEventTracker.getInfo(),
        events: this.events[CHAIN.ETH].length,
      },
      hmy: {
        info: this.hmyEventTracker.getInfo(),
        events: this.events[CHAIN.HMY].length,
      }
    }
  }

  getEvents = (filters: IEventFilterParams) => {
    const { chain = CHAIN.HMY, ...params } = filters;

    let events = this.events[chain];

    events = events.filter(e => {
      return Object.keys(params).every(
        key => String(e[key]).toUpperCase() === String(params[key]).toUpperCase()
      )
    })

    return events.slice(0, 10);
  }
}