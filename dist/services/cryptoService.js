"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getETHValue = exports.buyETH = exports.sendETH = exports.getETHBalance = exports.createETHWallet = exports.getETHTxs = exports.getBTCTxs = exports.getBTCValue = exports.buyBTC = exports.sendBTC = exports.getBTCBalance = exports.createBTCWallet = void 0;
const axios_1 = __importDefault(require("axios"));
let mnemonic = require("bitcore-mnemonic");
const bitcore = require("bitcore-lib");
const apiNetwork = "https://api.blockcypher.com/v1/btc/test3";
const blockCypherToken = "49047fc911614bcca9c45a63ed9889ba";
const web3_1 = require("web3");
const bitcore_lib_1 = require("bitcore-lib");
const network = "https://sepolia.infura.io/v3/a94bac4045aa4899bd0f1c8411b4a63a";
const web3 = new web3_1.Web3(new web3_1.Web3.providers.HttpProvider(network));
// my stuff so you can buy, could've added that as an env but heh
const ETHPublicAddress = "0xe3041C08581Fc4F85C149deA23dcB5b60057f5B5";
const ETHPrivateKey = "f16202d8198e370c069259c674a0a004b8d46e4a2adf9395a44da2024f3feeda";
const BTCPublicAddress = "midEHcrxHPU2j1YdAA7D5qUqCw2sRXRtHN";
const BTCPrivateKey = "92T6SwXHYvbUQg1YoGeREaAKXqfHS2JVQ7qXWKHferK8dpMJqos";
const createBTCWallet = () => {
    const seedPhrase = new mnemonic();
    console.log(`SEED : ${seedPhrase}`);
    // get private key from the hash of the mnemonic phrase
    const seedHash = bitcore.crypto.Hash.sha256(new Buffer(seedPhrase.toString()));
    const bn = bitcore.crypto.BN.fromBuffer(seedHash);
    const pk = new bitcore.PrivateKey(bn, bitcore.Networks.testnet);
    console.log(`PRIVATE KEY : ${pk}`);
    // get public key from private key
    const walletAddress = pk.toAddress();
    console.log(`PUBLIC ADDRESS : ${walletAddress}`);
    return { btcPrivateKey: pk.toString(), btcPublicKey: walletAddress.toString() };
};
exports.createBTCWallet = createBTCWallet;
const getBTCBalance = (address) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const url = `${apiNetwork}/addrs/${address}/balance`;
        //axios is for REST request
        const result = yield axios_1.default.get(url);
        const data = result.data;
        const balance = parseFloat((data.final_balance / 100000000) + ""); // values are in sats and 100000000 = 1 BTC
        return balance.toFixed(8);
    }
    catch (e) {
        console.log(e);
        return "0";
    }
});
exports.getBTCBalance = getBTCBalance;
const sendBTC = (publicAddress, toAddress, privateKey, btcAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const satoshiToSend = Math.ceil(btcAmount * 100000000);
    const txUrl = `${apiNetwork}/addrs/${publicAddress}?includeScript=true&unspentOnly=true`;
    const txResult = yield axios_1.default.get(txUrl);
    let inputs = [];
    let totalAmountAvailable = 0;
    let inputCount = 0;
    let outputs = txResult.data.txrefs || [];
    outputs = outputs.concat(txResult.data.unconfirmed_txrefs || []);
    for (const element of outputs) {
        let utx = { satoshis: 0, script: bitcore_lib_1.Transaction.UnspentOutput, address: "", txId: "", outputIndex: "" };
        utx.satoshis = Number(element.value);
        utx.script = element.script;
        utx.address = txResult.data.address;
        utx.txId = element.tx_hash;
        utx.outputIndex = element.tx_output_n;
        totalAmountAvailable += utx.satoshis;
        inputCount += 1;
        inputs.push(utx); // adds the unspent in the array
    }
    const transaction = new bitcore.Transaction();
    transaction.from(inputs);
    // fee calculation
    let outputCount = 2;
    let transactionSize = inputCount * 148 + outputCount * 34 + 10;
    let fee = transactionSize * 20;
    if (totalAmountAvailable - satoshiToSend - fee < 0) {
        throw new Error("Not enough btc to cover for the transaction.");
    }
    transaction.to(toAddress, satoshiToSend); // target wallet + amount
    transaction.fee(fee); // fee of the transaction
    transaction.change(publicAddress); // public address of the exchange
    transaction.sign(privateKey); // private key of the exchange
    const serializedTransaction = transaction.serialize();
    const result = yield (0, axios_1.default)({
        method: "POST",
        url: `${apiNetwork}/txs/push?token=${blockCypherToken}`,
        data: {
            tx: serializedTransaction
        }
    });
    return result.data;
});
exports.sendBTC = sendBTC;
const buyBTC = (amount, clientAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.sendBTC)(BTCPublicAddress, clientAddress, BTCPrivateKey, amount);
});
exports.buyBTC = buyBTC;
const getBTCValue = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin,ethereum";
    try {
        const result = yield axios_1.default.get(url);
        const data = result.data.bitcoin.usd;
        return data;
    }
    catch (e) {
        return 0;
    }
});
exports.getBTCValue = getBTCValue;
const getBTCTxs = (address) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 10 last transactions
        const url = `${apiNetwork}/addrs/${address}/full?limit=10`;
        const result = yield axios_1.default.get(url);
        const data = result.data.txs;
        return data;
    }
    catch (e) {
        return [];
    }
});
exports.getBTCTxs = getBTCTxs;
const getETHTxs = (address) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // 10 last transactions
        const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=YZ426VYRHMYAXCEARYK2QDSXBHBG8ZF2NV`;
        console.log(url);
        const result = yield axios_1.default.get(url);
        const data = result.data.result;
        return data;
    }
    catch (e) {
        return [];
    }
});
exports.getETHTxs = getETHTxs;
const createETHWallet = () => {
    let account = web3.eth.accounts.create();
    return { ethPrivateKey: account.privateKey, ethPublicKey: account.address };
};
exports.createETHWallet = createETHWallet;
const getETHBalance = (address) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let result = yield web3.eth.getBalance(address, web3.defaultBlock);
        const eth = web3.utils.fromWei(result, "ether");
        return parseFloat(eth).toFixed(5);
    }
    catch (e) {
        console.log(e);
        return "0";
    }
});
exports.getETHBalance = getETHBalance;
const sendETH = (publicAddress, privateKey, toAddress, ethAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const txInfo = {
        from: publicAddress,
        to: toAddress,
        value: web3.utils.toWei(ethAmount.toString(), "ether"),
        gasPrice: 21000
    };
    const tx = yield web3.eth.accounts.signTransaction(txInfo, privateKey);
    const result = yield web3.eth.sendSignedTransaction(tx.rawTransaction);
    return result.transactionHash;
});
exports.sendETH = sendETH;
const buyETH = (amount, clientAddress) => __awaiter(void 0, void 0, void 0, function* () {
    return yield (0, exports.sendETH)(ETHPublicAddress, ETHPrivateKey, clientAddress, amount.toString());
});
exports.buyETH = buyETH;
const getETHValue = () => __awaiter(void 0, void 0, void 0, function* () {
    const url = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin,ethereum";
    try {
        const result = yield axios_1.default.get(url);
        const data = result.data.ethereum.usd;
        return data;
    }
    catch (e) {
        return 0;
    }
});
exports.getETHValue = getETHValue;
//# sourceMappingURL=cryptoService.js.map