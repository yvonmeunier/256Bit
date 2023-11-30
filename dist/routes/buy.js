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
const userController_1 = require("../controllers/userController");
const express_validator_1 = require("express-validator");
var express = require('express');
var router = express.Router();
router.get('/coins', function (req, res, next) {
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
        // So that whatever price we show is what we charge
        req.session.btcValue = btcValue;
        req.session.ethValue = ethValue;
        res.render('buy', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, btcValue: btcValue, ethValue: ethValue, balanceFiat: fiat, error: req.flash('error'),
            success: req.flash('success') });
    });
});
router.get('/fiat', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        // update just in case
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        let user = req.session.user;
        let fiat = user.fiat.toFixed(2);
        let balanceETH = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let balanceBTC = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        res.render('buyfiat', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, error: req.flash('error'),
            success: req.flash('success') });
    });
});
router.post('/coins', [
    (0, express_validator_1.body)("amount").notEmpty().withMessage("The amount must be specified").isNumeric().withMessage("The amount must be a number"),
    (0, express_validator_1.body)("currency").notEmpty().withMessage("ERROR : Currency not specified!!! R U A HAXXOR? 💀")
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
            return res.redirect("/buy/coins");
        }
        // update just in case
        let user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.session.user = user;
        const { amount, currency } = req.body;
        let btcValue = req.session.btcValue;
        let ethValue = req.session.ethValue;
        var total;
        // verify if user has enough fiat
        if (currency == "btc") {
            total = btcValue * amount;
            if (user.fiat < total) {
                req.flash("error", "You dont have enough fiat to perform the purchase");
                return res.redirect("/buy/coins");
            }
            try {
                const result = yield (0, cryptoService_1.buyBTC)(amount, user.btcPublicKey);
                req.flash("success", "The transaction was a success! Thank you for your purchase");
            }
            catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                return res.redirect("/buy/coins");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat - total });
            return res.redirect("/buy/coins");
        }
        else if (currency == "eth") {
            total = ethValue * amount;
            if (user.fiat < total) {
                req.flash("error", "You dont have enough fiat to perform the purchase");
                return res.redirect("/buy/coins");
            }
            try {
                yield (0, cryptoService_1.buyETH)(amount, user.ethPublicKey);
                req.flash("success", "The transaction was a success! Thank you for your purchase");
            }
            catch (e) {
                req.flash("error", e.message);
                return res.redirect("/buy/coins");
            }
            yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat - total });
            return res.redirect("/buy/coins");
        }
        return res.redirect("/buy/coins");
    });
});
router.post('/fiat', [
    (0, express_validator_1.body)("amount").notEmpty().withMessage("Amount is empty").isNumeric().withMessage("Amount must be a number"),
    (0, express_validator_1.body)("credit").notEmpty().withMessage("Credit card number is empty").isCreditCard().withMessage("Credit card number invalid"),
    (0, express_validator_1.body)("cvc").notEmpty().withMessage("CVC is empty"),
    (0, express_validator_1.body)("date").notEmpty().withMessage("Date is empty")
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
            return res.redirect("/buy/fiat");
        }
        // update just in case
        let user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.session.user = user;
        var { amount } = req.body;
        amount = Math.abs(amount);
        yield (0, userController_1.updateUser)(user._id.toString(), { fiat: user.fiat + amount });
        return res.redirect("/home");
    });
});
// YOU CAN BUY FIAT THEN BUY BTC AND ETH WITH IT
exports.default = router;
//# sourceMappingURL=buy.js.map