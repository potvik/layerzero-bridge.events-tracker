import * as process from 'process';

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
    contract: process.env.HMY_LZ_CONTRACT
  },
  bsc: {
    name: 'bsc',
    url: process.env.BSC_NODE_URL,
    contract: process.env.BSC_LZ_CONTRACT
  },
  eth: {
    name: 'eth',
    url: process.env.ETH_NODE_URL,
    contract: process.env.ETH_LZ_CONTRACT
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});