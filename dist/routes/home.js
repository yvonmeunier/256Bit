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
Object.defineProperty(exports, "__esModule", { value: true });
const cryptoService_1 = require("../services/cryptoService");
const userBroker_1 = require("../brokers/userBroker");
var express = require('express');
var router = express.Router();
/* GET home page. */
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
        let BTCtxs = yield (0, cryptoService_1.getBTCTxs)(user.btcPublicKey);
        let ETHtxs = yield (0, cryptoService_1.getETHTxs)(user.ethPublicKey);
        // TODO : ETHtxs
        res.render('home', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, BTCtxs: BTCtxs, ETHtxs: ETHtxs, username: user.username, balanceFiat: fiat });
    });
});
exports.default = router;
//# sourceMappingURL=home.js.map