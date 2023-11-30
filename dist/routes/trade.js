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
const cryptograhpy_1 = require("../services/cryptograhpy");
const crypto_1 = __importDefault(require("crypto"));
const process_1 = __importDefault(require("process"));
const express_validator_1 = require("express-validator");
const cryptoService_1 = require("../services/cryptoService");
var express = require('express');
const bitcore = require("bitcore-lib");
const web3_1 = require("web3");
const userBroker_1 = require("../brokers/userBroker");
const network = "https://sepolia.infura.io/v3/a94bac4045aa4899bd0f1c8411b4a63a";
const web3 = new web3_1.Web3(new web3_1.Web3.providers.HttpProvider(network));
var router = express.Router();
router.get('/', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        // update just in case
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        let user = req.session.user;
        let balanceETH = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let balanceBTC = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        let fiat = user.fiat.toFixed(2);
        res.render('trade', {
            title: '256Bit',
            balanceBTC: balanceBTC,
            balanceETH: balanceETH,
            username: user.username,
            balanceFiat: fiat
        });
    });
});
router.post('/', [
    (0, express_validator_1.body)("toAddress").notEmpty().withMessage("The target address is empty"),
    (0, express_validator_1.body)("amount").notEmpty().withMessage("Amount unspecified")
], function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        const result = (0, express_validator_1.validationResult)(req);
        if (!result.isEmpty()) {
            const errorMessages = result.formatWith(error => {
                if (error.msg != "Invalid value") {
                    return error.msg;
                }
            }).array();
            req.flash('error', errorMessages);
            return res.redirect("/trade");
        }
        const { toAddress, amount, currency } = req.body;
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        let user = req.session.user;
        //TODO: MFA CHECK
        req.session.performedTwoFA = [""];
        if (user.isEmail2FA == true) {
            req.session.tradeTx = { toAddress, amount, currency };
            req.session.txType = "trade";
            req.session.TwoFAType = "email";
            return res.redirect("/mfa/tx");
        }
        if (user.isSMS2FA == true) {
            req.session.tradeTx = { toAddress, amount, currency };
            req.session.txType = "trade";
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa/tx");
        }
        if (user.isGoogle2FA == true) {
            req.session.tradeTx = { toAddress, amount, currency };
            req.session.txType = "trade";
            req.session.TwoFAType = "google";
            return res.redirect("/mfa/tx");
        }
        let password = req.session.password;
        let user_key = crypto_1.default.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        if (currency == "btc") {
            if (!bitcore.Address.isValid(toAddress, bitcore.Networks.testnet)) {
                req.flash('error', "The recipient address must be valid.");
                res.redirect("/trade");
                return;
            }
            try {
                yield (0, cryptoService_1.sendBTC)(user.btcPublicKey, btcPrivateKey, toAddress, amount);
                req.flash('success', amount + " BTC sent successfully to " + toAddress
                    + ". I may take up to few minutes before the transaction is completed.");
                res.redirect("/trade");
            }
            catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                res.redirect("/trade");
            }
        }
        else if (currency == "eth") {
            if (!web3.utils.isAddress(toAddress)) {
                req.flash("error", "the address is invalid bozo");
                res.redirect("/trade");
                return;
            }
            try {
                let txId = yield (0, cryptoService_1.sendETH)(user.ethPublicKey, ethPrivateKey, toAddress, amount);
                req.flash('success', amount + " ETH sent successfully to " + toAddress
                    + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'> Transaction #" + txId + "</a>");
                res.redirect("/trade");
            }
            catch (e) {
                req.flash("error", e.message);
                res.redirect("/trade");
            }
        }
    });
});
router.get('/perform', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        if (req.session.tradeTx == null) {
            req.flash('error', "MFA Failed");
            return res.redirect("/trade");
        }
        const { toAddress, amount, currency } = req.session.tradeTx;
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        let user = req.session.user;
        let password = req.session.password;
        let user_key = crypto_1.default.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        if (currency == "btc") {
            if (!bitcore.Address.isValid(toAddress, bitcore.Networks.testnet)) {
                req.flash('error', "The recipient address must be valid.");
                res.redirect("/trade");
                return;
            }
            try {
                yield (0, cryptoService_1.sendBTC)(user.btcPublicKey, btcPrivateKey, toAddress, amount);
                req.flash('success', amount + " BTC sent successfully to " + toAddress
                    + ". I may take up to few minutes before the transaction is completed.");
                res.redirect("/trade");
            }
            catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                res.redirect("/trade");
            }
        }
        else if (currency == "eth") {
            if (!web3.utils.isAddress(toAddress)) {
                req.flash("error", "the address is invalid bozo");
                res.redirect("/trade");
                return;
            }
            try {
                let txId = yield (0, cryptoService_1.sendETH)(user.ethPublicKey, ethPrivateKey, toAddress, amount);
                req.flash('success', amount + " ETH sent successfully to " + toAddress
                    + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'> Transaction #" + txId + "</a>");
                res.redirect("/trade");
            }
            catch (e) {
                req.flash("error", e.message);
                res.redirect("/trade");
            }
        }
    });
});
exports.default = router;
//# sourceMappingURL=trade.js.map