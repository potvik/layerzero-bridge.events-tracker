const sleep = (ms) => new Promise(res => setTimeout(res, ms));

const ReceiveFromChainAbi = { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint16", "name": "srcChainId", "type": "uint16" }, { "indexed": false, "internalType": "bytes", "name": "fromAddress", "type": "bytes" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256" }], "name": "ReceiveFromChain", "type": "event" };
// const TransferAbi = { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "value", "type": "uint256" }], "name": "Transfer", "type": "event" };
const PacketReceivedAbi = { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint16", "name": "srcChainId", "type": "uint16" }, { "indexed": false, "internalType": "bytes", "name": "srcAddress", "type": "bytes" }, { "indexed": true, "internalType": "address", "name": "dstAddress", "type": "address" }, { "indexed": false, "internalType": "uint64", "name": "nonce", "type": "uint64" }, { "indexed": false, "internalType": "bytes32", "name": "payloadHash", "type": "bytes32" }], "name": "PacketReceived", "type": "event" };

const decodeLogs = (logs: any[], inputs: any[], web3) => {
    for (let i = 0; i < logs.length; i++) {
        const log = logs[i];
        try {
            const params = web3.eth.abi.decodeLog(
                inputs,
                log.data,
                log.topics.slice(1)
            );

            return { ...params, address: log.address };
        } catch (e) {
        }
    }
}

export const parseTx = async (txHash, web3) => {
    let txData;

    while (!txData) {
        try {
            txData = await web3.eth.getTransactionReceipt(txHash);
        } catch (e) {
            console.log("Failed to load tx: ", txHash, e && e.message);
            await sleep(1000);
            console.log("Sleep 1 sec and try again");
        }
    }

    const { logs } = txData;

    const packetReceived = decodeLogs([logs[0]], PacketReceivedAbi.inputs, web3);
    const receiveFromChain = decodeLogs([logs[logs.length - 1]], ReceiveFromChainAbi.inputs, web3);

    return {
        transactionHash: txHash,
        blockNumber: txData.blockNumber,
        srcChainId: packetReceived.srcChainId,
        srcUaAddress: packetReceived.srcAddress,
        dstUaAddress: packetReceived.dstAddress,
        srcUaNonce: packetReceived.nonce,
        payloadHash: packetReceived.payloadHash,
        from: receiveFromChain?.fromAddress,
        to: receiveFromChain?.to,
        amount: receiveFromChain?.amount
    }
};