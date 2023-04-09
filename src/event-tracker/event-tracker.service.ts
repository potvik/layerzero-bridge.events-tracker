import { AbiItem } from 'web3-utils/types';
import Web3 from 'web3';
import {
  getContractDeploymentBlock,
  getEventsAbi,
  getHmyLogs,
} from './api';

import EventEmitter = require('events');
import { Injectable, Logger } from '@nestjs/common';

export interface IEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
  name: string;
  returnValues: any;
}

export interface IEventTrackerService {
  contractAddress: string;
  contractAbi: any[];
  getEventCallback: (IEvent) => Promise<any>;
  chain?: 'bsc' | 'eth' | 'hmy';
  eventName?: string;
  web3: Web3;
}

const sleep = ms => new Promise(res => setTimeout(res, ms));

@Injectable()
export class EventTrackerService {
  private readonly logger = new Logger(EventTrackerService.name);
  dbCollectionPrefix = '';

  chain: 'hmy' | 'eth' | 'bsc' = "eth";

  events: any[] = [];

  lastBlock = 0;
  lastNodeBlock = 0;
  startBlock = 0;
  lastSuccessfulRead = 0;
  contractAddress = '';

  blocksInterval = 1024;
  waitInterval = 500;
  cacheLimit = 10000;

  abiEvents: Record<string, AbiItem>;
  contractAbiEvents: any[];
  eventLogs = [];
  eventName = '';

  getEventCallback: (IEvent) => Promise<any>;
  contract: any;

  web3: Web3;

  constructor(
    params: IEventTrackerService,
  ) {
    this.web3 = params.web3;
    this.chain = params.chain || 'eth';

    this.contractAddress = params.contractAddress;
    this.abiEvents = getEventsAbi(this.web3, params.contractAbi);
    this.getEventCallback = params.getEventCallback;
    this.contract = new this.web3.eth.Contract(params.contractAbi, params.contractAddress);
    this.eventName = params.eventName || '';
  }

  async start() {
    try {
      // this.lastBlock = await getContractDeploymentBlock(this.contractAddress);
      // this.startBlock = this.lastBlock;

      this.lastNodeBlock = await this.web3.eth.getBlockNumber();

      this.lastBlock = this.lastNodeBlock - 30000;
      this.startBlock = this.lastBlock;

      // const defStartBlock = Number(this.lastNodeBlock) - 250000;

      // const req = await this.getAllEvents({ size: 1, page: 0, sort: { blockNumber: -1 } });

      // if (req.content.length) {
      //   this.lastBlock = req.content[0].blockNumber;
      //   // this.lastBlock = Number(this.lastBlock) - 250000; // reload last 5 days on restart
      //   this.lastBlock = Number(this.lastBlock) - 100000; // reload last 2 days on restart
      // }

      // this.lastBlock = Math.max(this.lastBlock, defStartBlock);
      // this.startBlock = this.lastBlock;

      setTimeout(this.readEvents, 100);

      this.logger.log(`Start Event Service ${this.dbCollectionPrefix} - ok`, {
        lastBlock: this.lastBlock,
        startBlock: this.startBlock,
      });
    } catch (e) {
      this.logger.error(`Start ${this.dbCollectionPrefix}`, { error: e });
      throw new Error(`start ${this.dbCollectionPrefix}: ${e.message}`);
    }
  }

  addIfNotFoundMany = async (events: IEvent[]) => {
    for (let i = 0; i < events.length; i++) {
      const collectionName = `${this.dbCollectionPrefix}_data`;

      // const dbEvent = await this.database.find(collectionName, {
      //   transactionHash: events[i].transactionHash,
      //   data: events[i].data,
      // });

      // if (!dbEvent) {
      //   await this.database.insert(collectionName, events[i]);
      // }
    }
  };

  readEvents = async () => {
    try {
      this.lastNodeBlock = await this.web3.eth.getBlockNumber();

      if (this.lastNodeBlock > this.lastBlock) {
        const from = this.lastBlock;
        const to =
          from + this.blocksInterval > this.lastNodeBlock
            ? this.lastNodeBlock
            : from + this.blocksInterval;

        let result = [];

        if (this.chain === "hmy") {
          const res = await getHmyLogs({
            fromBlock: '0x' + from.toString(16),
            toBlock: '0x' + to.toString(16),
            address: this.contractAddress,
          });

          result = res.result;
        } else {
          result = await this.contract.getPastEvents(this.eventName || "allEvents", {
            fromBlock: '0x' + from.toString(16),
            toBlock: '0x' + to.toString(16),
          });
        }

        const events = [];

        for (let i = 0; i < result.length; i++) {
          const item = result[i];

          const topics = this.chain === 'hmy' ? item.topics : item.raw.topics;

          const topic = topics[0].toLowerCase();
          const abiItem = this.abiEvents[topic];

          if (abiItem) {
            const returnValues = this.web3.eth.abi.decodeLog(
              abiItem.inputs,
              item.data,
              topics.slice(1)
            );

            events.push({
              ...item,
              name: abiItem.name,
              returnValues,
              blockNumber: Number(item.blockNumber),
            });
          }
        }

        if (events.length) {
          // save events to DB
          await this.addIfNotFoundMany(events);

          // send events to other services via eventsEmitter
          // events.forEach(event => this.eventEmitter.emit(event.name, event));
          await Promise.all(events.map(async e => await this.getEventCallback(e)));
        }

        // cache - disabled
        // this.events = this.eventLogs.concat(events);

        this.lastBlock = to;
        this.lastSuccessfulRead = Date.now();

        // console.log('Last block: ', this.lastBlock);
      } else {
        await sleep(20);
      }
    } catch (e) {
      this.logger.error('Error getEvents', { error: e });
    }

    setTimeout(this.readEvents, this.waitInterval);
  };

  getProgress = () =>
    ((this.lastBlock - this.startBlock) / (this.lastNodeBlock - this.startBlock)).toFixed(4);

  getInfo = () => {
    return {
      progress: this.getProgress(),
      lastBlock: this.lastBlock,
      lastNodeBlock: this.lastNodeBlock,
      lastSuccessfulRead: this.lastSuccessfulRead,
      blocksInterval: this.blocksInterval,
      dbCollectionPrefix: this.dbCollectionPrefix,
      contractAddress: this.contractAddress,
      waitInterval: this.waitInterval,
    };
  };

  getAllEvents = async (params: any) => ({ content: [] });
}