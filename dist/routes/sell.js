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
const cryptoService_1 = require("../services/cryptoService");
const userBroker_1 = require("../brokers/userBroker");
var express = require('express');
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
const crypto_1 = __importDefault(require("crypto"));
const process_1 = __importDefault(require("process"));
const cryptograhpy_1 = require("../services/cryptograhpy");
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
        let btcValue = yield (0, cryptoService_1.getBTCValue)();
        let ethValue = yield (0, cryptoService_1.getETHValue)();
        let fiat = user.fiat.toFixed(2);
        // So that whatever price we show is what he sends
        req.session.btcValue = btcValue;
        req.session.ethValue = ethValue;
        res.render('sell', {
            title: '256Bit',
            balanceBTC: balanceBTC,
            balanceETH: balanceETH,
            username: user.username,
            btcValue: btcValue,
            ethValue: ethValue,
            balanceFiat: fiat,
            error: req.flash('error'),
            success: req.flash('success')
        });
    });
});
router.get('/perform', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        // update just in case
        let user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.session.user = user;
        if (req.session.sellTx == null) {
            req.flash('error', "MFA Failed");
            return res.redirect("/sell");
        }
        const { amount, currency } = req.session.sellTx;
        let btcValue = req.session.btcValue;
        let ethValue = req.session.ethValue;
        let password = req.session.password;
        var total;
        let userBTCs = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        let userETHs = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let user_key = crypto_1.default.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.ethPrivateKey, user_key, server_key, user.iv);
        if (currency == "btc") {
            total = btcValue * amount;
            if (userBTCs < amount) {
                req.flash("error", "You dont have enough btcs to perform the transaction");
                return res.redirect("/sell");
            }
            try {
                yield (0, cryptoService_1.sendBTC)(user.btcPublicKey, "midEHcrxHPU2j1YdAA7D5qUqCw2sRXRtHN", btcPrivateKey, amount);
                req.flash("success", "The transaction was a success!");
            }
            catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                return res.redirect("/sell");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat + total });
            return res.redirect("/sell");
        }
        else if (currency == "eth") {
            total = ethValue * amount;
            if (userETHs < amount) {
                req.flash("error", "You dont have enough eths to perform the transaction");
                return res.redirect("/sell");
            }
            try {
                yield (0, cryptoService_1.sendETH)(user.ethPublicKey, ethPrivateKey, "0xe3041C08581Fc4F85C149deA23dcB5b60057f5B5", amount);
                req.flash("success", "The transaction was a success!");
            }
            catch (e) {
                req.flash("error", e.message);
                return res.redirect("/sell");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat + total });
            return res.redirect("/sell");
        }
        return res.redirect("/sell");
    });
});
router.post('/', [
    (0, express_validator_1.body)("amount").notEmpty().withMessage("The amount must be specified").isNumeric().withMessage("The amount must be a number"),
    (0, express_validator_1.body)("currency").notEmpty().withMessage("ERROR : Currency not specified!!! R U A HAXXOR? 💀")
], function (req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        // do the sell thing
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
            return res.redirect("/buy/coins");
        }
        // update just in case
        let user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.session.user = user;
        const { amount, currency } = req.body;
        req.session.performedTwoFA = [""];
        if (user.isEmail2FA == true) {
            req.session.sellTx = { amount, currency };
            req.session.txType = "sell";
            req.session.TwoFAType = "email";
            return res.redirect("/mfa/tx");
        }
        if (user.isSMS2FA == true) {
            req.session.sellTx = { amount, currency };
            req.session.txType = "sell";
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa/tx");
        }
        if (user.isGoogle2FA == true) {
            req.session.sellTx = { amount, currency };
            req.session.txType = "sell";
            req.session.TwoFAType = "google";
            return res.redirect("/mfa/tx");
        }
        let btcValue = req.session.btcValue;
        let ethValue = req.session.ethValue;
        let password = req.session.password;
        var total;
        let userBTCs = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        let userETHs = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let user_key = crypto_1.default.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.ethPrivateKey, user_key, server_key, user.iv);
        if (currency == "btc") {
            total = btcValue * amount;
            if (userBTCs < amount) {
                req.flash("error", "You dont have enough btcs to perform the transaction");
                return res.redirect("/sell");
            }
            try {
                yield (0, cryptoService_1.sendBTC)(user.btcPublicKey, "midEHcrxHPU2j1YdAA7D5qUqCw2sRXRtHN", btcPrivateKey, amount);
                req.flash("success", "The transaction was a success!");
            }
            catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                return res.redirect("/sell");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat + total });
            return res.redirect("/sell");
        }
        else if (currency == "eth") {
            total = ethValue * amount;
            if (userETHs < amount) {
                req.flash("error", "You dont have enough eths to perform the transaction");
                return res.redirect("/sell");
            }
            try {
                yield (0, cryptoService_1.sendETH)(user.ethPublicKey, ethPrivateKey, "0xe3041C08581Fc4F85C149deA23dcB5b60057f5B5", amount);
                req.flash("success", "The transaction was a success!");
            }
            catch (e) {
                req.flash("error", e.message);
                return res.redirect("/sell");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat + total });
            return res.redirect("/sell");
        }
        return res.redirect("/sell");
    });
});
exports.default = router;
//# sourceMappingURL=sell.js.map