import * as process from 'process';

export default () => ({
  hmy: {
    name: 'hmy',
    url: process.env.HMY_NODE_URL,
    contract: process.env.HMY_LZ_CONTRACT || "0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4",
  },
  bsc: {
    name: 'bsc',
    url: process.env.BSC_NODE_URL,
    contract: process.env.BSC_LZ_CONTRACT || "0x4D73AdB72bC3DD368966edD0f0b2148401A178E2",
  },
  eth: {
    name: 'eth',
    url: process.env.ETH_NODE_URL,
    contract: process.env.ETH_LZ_CONTRACT || "0x4D73AdB72bC3DD368966edD0f0b2148401A178E2",
  },
  version: process.env.npm_package_version || '0.0.1',
  name: process.env.npm_package_name || '',
  port: parseInt(process.env.PORT, 10) || 8080,
});