import axios from 'axios';
import Web3 from 'web3';
import { AbiItem } from 'web3-utils/types';
import { sleep } from '../utils';

export const getContractDeploymentBlock = async (address): Promise<number> => {
  try {
    const contract: any = await axios.get(
      `${process.env.HMY_EXPLORER_API}/shard/0/address/${address.toLowerCase()}/contract`
    );

    return Number(contract.data.blockNumber);
  } catch (e) {
    throw new Error(`Contract not found ${address}`);
    // return null;
  }
};

interface IParams {
  fromBlock: string;
  toBlock: string;
  address: string;
  topics?: string[];
}

export const getHmyLogs = async (params: IParams) => {
  const res: any = await axios.post(process.env.HMY_NODE_URL, {
    jsonrpc: '2.0',
    method: 'hmy_getLogs',
    params: [params],
    id: 74,
  });

  if (!res.data.result && res.data.error) {
    throw res.data.error.message;
  }

  return res.data;
};

export const getEvent = (web3: Web3, abi: AbiItem[], eventName: string) => {
  const abiItem: AbiItem = abi.find(a => a.type === 'event' && a.name === eventName);

  return { ...abiItem, signature: web3.eth.abi.encodeEventSignature(abiItem) };
};

export const getHmyTransactionReceipt = async (hash: string) => {
  const res: any = await axios.post(process.env.HMY_NODE_URL, {
    jsonrpc: '2.0',
    method: 'hmyv2_getTransactionReceipt',
    params: [hash],
    id: 1,
  });

  if (!res.data?.result && res.data.error) {
    throw res.data.error.message;
  }

  return res.data.result;
};

export const getHmyTransactionByHash = async (hash: string) => {
  const res: any = await axios.post(process.env.HMY_NODE_URL, {
    jsonrpc: '2.0',
    method: 'hmyv2_getTransactionByHash',
    params: [hash],
    id: 1,
  });

  if (!res.data?.result && res.data.error) {
    throw res.data.error.message;
  }

  return res.data.result;
};

export const getEventsAbi = (web3: Web3, abi: AbiItem[]) => {
  const extAbi = abi
    .filter(a => a.type === 'event')
    .map(abiItem => ({
      ...abiItem,
      signature: web3.eth.abi.encodeEventSignature(abiItem).toLowerCase(),
    }));

  const res = {};

  extAbi.forEach(abiItem => (res[abiItem.signature] = abiItem));

  return res;
};

export const getEventsAbiArray = (web3: Web3, abi: AbiItem[]) => {
  return abi
    .filter(a => a.type === 'event')
    .map(abiItem => ({
      ...abiItem,
      signature: web3.eth.abi.encodeEventSignature(abiItem).toLowerCase(),
    }));
};

export const errorResponse = [
  'invalid json response',
  'handle request error',
  'Invalid JSON RPC response',
  'nonce too low',
  'was not mined within 750 seconds',
  'The transaction is still not confirmed after 20 attempts',
  'replacement transaction underpriced',
  'Client network socket disconnected before secure TLS connection was established',
].map(text => text.toLowerCase());

export const rpcErrorMessage = error => {
  if (error && error.message) {
    return errorResponse.some(text => error.message.toLowerCase().includes(text));
  }

  if (typeof error === 'string') {
    return errorResponse.some(text => error.toLowerCase().includes(text));
  }

  return false;
};

export const rpcErrorHandler = (func: () => Promise<any>) => async (...args) => {
  try {
    return func.apply(this, args);
  } catch (e) {
    if (rpcErrorMessage(e)) {
      // log.error('rpcErrorHandler exception', { erc20TokenAddr, error: e });

      await sleep(10000);

      return await rpcErrorHandler(func).apply(this, args);
    } else {
      throw e;
    }
  }
};