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
const cryptograhpy_1 = require("../services/cryptograhpy");
const crypto_1 = __importDefault(require("crypto"));
const process_1 = __importDefault(require("process"));
var express = require('express');
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
        let password = req.session.password;
        let fiat = user.fiat.toFixed(2);
        let balanceETH = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let balanceBTC = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        let user_key = crypto_1.default.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.ethPrivateKey, user_key, server_key, user.iv);
        res.render('wallet', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, btcPrivateKey: btcPrivateKey, ethPrivateKey: ethPrivateKey, btcPublicKey: user.btcPublicKey, ethPublicKey: user.ethPublicKey });
    });
});
exports.default = router;
//# sourceMappingURL=wallet.js.map