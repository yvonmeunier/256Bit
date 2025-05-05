import axios from "axios";

let mnemonic = require("bitcore-mnemonic");
const bitcore = require("bitcore-lib");
const apiNetwork = "https://api.blockcypher.com/v1/btc/test3";
const blockCypherToken = "";

import {Web3} from 'web3';
import {Transaction as ETHT} from 'web3'
import {Networks, Transaction} from "bitcore-lib";
import add = Networks.add;
const network = "https://sepolia.infura.io/v3/a94bac4045aa4899bd0f1c8411b4a63a";
const web3 = new Web3(new Web3.providers.HttpProvider(network))

// my stuff so you can buy, could've added that as an env but heh
const ETHPublicAddress = "";
const ETHPrivateKey = "";
const BTCPublicAddress = "";
const BTCPrivateKey = "";



export const createBTCWallet =  () => {
    const seedPhrase = new mnemonic();
    console.log(`SEED : ${seedPhrase}`);
    // get private key from the hash of the mnemonic phrase
    const seedHash = bitcore.crypto.Hash.sha256(new Buffer(seedPhrase.toString()));
    const bn = bitcore.crypto.BN.fromBuffer(seedHash);
    const pk = new bitcore.PrivateKey(bn , bitcore.Networks.testnet);
    console.log(`PRIVATE KEY : ${pk}`);
    // get public key from private key
    const walletAddress = pk.toAddress();
    console.log(`PUBLIC ADDRESS : ${walletAddress}`);
    return {btcPrivateKey: pk.toString(), btcPublicKey: walletAddress.toString()};
};

export const getBTCBalance = async (address: string) => {

    try {
        const url = `${apiNetwork}/addrs/${address}/balance`;
        //axios is for REST request
        const result = await axios.get(url);
        const data = result.data;
        const balance = parseFloat((data.final_balance / 100000000) + "");// values are in sats and 100000000 = 1 BTC
        return balance.toFixed(8);

    }catch (e) {
        console.log(e);
        return "0";
    }
}

export const sendBTC = async (publicAddress: string, toAddress: string, privateKey: string, btcAmount: number) => {

    const satoshiToSend = Math.ceil(btcAmount * 100000000);
    const txUrl = `${apiNetwork}/addrs/${publicAddress}?includeScript=true&unspentOnly=true`;
    const txResult = await axios.get(txUrl);

    let inputs = [];
    let totalAmountAvailable = 0;
    let inputCount = 0;

    let outputs = txResult.data.txrefs || [];
    outputs = outputs.concat(txResult.data.unconfirmed_txrefs || []);

    for (const element of outputs) {
        let utx  = {satoshis: 0, script : Transaction.UnspentOutput, address: "", txId: "", outputIndex: ""};
        utx.satoshis = Number(element.value);
        utx.script = element.script;
        utx.address = txResult.data.address;
        utx.txId = element.tx_hash;
        utx.outputIndex = element.tx_output_n;
        totalAmountAvailable += utx.satoshis;
        inputCount += 1;

        inputs.push(utx);// adds the unspent in the array
    }

    const transaction = new bitcore.Transaction();
    transaction.from(inputs);
    // fee calculation
    let outputCount = 2;
    let transactionSize = inputCount * 148 + outputCount * 34 + 10;
    let fee = transactionSize * 20;
    if (totalAmountAvailable - satoshiToSend - fee < 0){
        throw new Error("Not enough btc to cover for the transaction.")
    }

    transaction.to(toAddress, satoshiToSend);// target wallet + amount
    transaction.fee(fee);// fee of the transaction
    transaction.change(publicAddress);// public address of the exchange
    transaction.sign(privateKey);// private key of the exchange
    const serializedTransaction = transaction.serialize()
    const result = await axios({
        method: "POST",
        url: `${apiNetwork}/txs/push?token=${blockCypherToken}`,
        data: {
            tx: serializedTransaction
        }
    });
    return result.data;

}

export const buyBTC = async (amount : number, clientAddress: string) => {
    return await sendBTC(BTCPublicAddress, clientAddress, BTCPrivateKey, amount);
}

export const getBTCValue = async () => {
    const url = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin,ethereum"
    try {
        const result = await axios.get(url);
        const data = result.data.bitcoin.usd;
        return data;
    } catch (e) {
        return 0;
    }
}

export const getBTCTxs = async (address:string) => {

    try {
        // 10 last transactions
        const url = `${apiNetwork}/addrs/${address}/full?limit=10`;
        const result = await axios.get(url);
        const data = result.data.txs;
        return data;
    } catch (e) {
        return [];
    }

}

export const getETHTxs = async (address: string) => {
    try {
        // 10 last transactions
        const url = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10&sort=asc&apikey=YZ426VYRHMYAXCEARYK2QDSXBHBG8ZF2NV`;
        console.log(url);
        const result = await axios.get(url);
        const data = result.data.result;
        return data;
    } catch (e) {
        return [];
    }
}



export const createETHWallet = () => {
    let account = web3.eth.accounts.create()
    return {ethPrivateKey:account.privateKey,ethPublicKey:account.address};
};

export const getETHBalance = async (address: string) => {
    try {
        let result = await web3.eth.getBalance(address, web3.defaultBlock)
        const eth = web3.utils.fromWei(result, "ether");
        return parseFloat(eth).toFixed(5);
    } catch (e) {
        console.log(e);
        return "0";
    }

}

export const sendETH = async (publicAddress: string, privateKey: string, toAddress: string, ethAmount: string) => {
    const txInfo : ETHT = {
        from: publicAddress,
        to: toAddress,
        value: web3.utils.toWei(ethAmount.toString(), "ether"),
        gasPrice: 21000
    };
    const tx = await web3.eth.accounts.signTransaction(txInfo, privateKey);
    const result = await web3.eth.sendSignedTransaction(tx.rawTransaction);
    return result.transactionHash;
}

export const buyETH = async (amount: number, clientAddress: string) => {
    return await sendETH(ETHPublicAddress, ETHPrivateKey, clientAddress, amount.toString())
}

export const getETHValue = async () => {
    const url = "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=bitcoin,ethereum"
    try {
        const result = await axios.get(url);
        const data = result.data.ethereum.usd;
        return data;
    } catch (e) {
        return 0;
    }
}
