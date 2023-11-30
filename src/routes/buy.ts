import {NextFunction, Request, Response} from "express";
import {
    buyBTC,
    buyETH,
    getBTCBalance,
    getBTCValue,
    getETHBalance,
    getETHValue
} from "../services/cryptoService";
import {getUserByEmail} from "../brokers/userBroker";
import {updateUser} from "../controllers/userController";
import {UserDoc} from "../models/user";

import {body, validationResult} from "express-validator";
var express = require('express');
var router = express.Router();

router.get('/coins', async function(req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    // update just in case
    req.session.user = await getUserByEmail(req.session.user.email);
    let user = req.session.user;
    let balanceETH = await getETHBalance(user.ethPublicKey);
    let balanceBTC = await getBTCBalance(user.btcPublicKey);
    let btcValue = await getBTCValue();
    let ethValue = await getETHValue();
    let fiat = user.fiat.toFixed(2);
    // So that whatever price we show is what we charge
    req.session.btcValue = btcValue;
    req.session.ethValue = ethValue;

    res.render('buy', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, btcValue: btcValue, ethValue: ethValue , balanceFiat: fiat, error: req.flash('error'),
        success: req.flash('success')});
});

router.get('/fiat', async function(req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    // update just in case
    req.session.user = await getUserByEmail(req.session.user.email);
    let user = req.session.user;
    let fiat = user.fiat.toFixed(2);
    let balanceETH = await getETHBalance(user.ethPublicKey);
    let balanceBTC = await getBTCBalance(user.btcPublicKey);
    res.render('buyfiat', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, error: req.flash('error'),
        success: req.flash('success')});
});

router.post('/coins', [
    body("amount").notEmpty().withMessage("The amount must be specified").isNumeric().withMessage("The amount must be a number"),
    body("currency").notEmpty().withMessage("ERROR : Currency not specified!!! R U A HAXXOR? 💀")
],async function (req: Request, res: Response) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errorMessages = result.formatWith(error => {
            if (error.msg != "Invalid value") {
                return error.msg as string
            }
        }).array();
        req.flash('error', errorMessages);
        return res.redirect("/buy/coins");
    }
    // update just in case
    let user : UserDoc = await getUserByEmail(req.session.user.email);
    req.session.user = user;

    const {amount, currency} = req.body;

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
            const result = await buyBTC(amount, user.btcPublicKey);
            req.flash("success", "The transaction was a success! Thank you for your purchase")
        } catch (e) {
            let errorMessage = e.message;
            console.log(errorMessage);
            if (e.response && e.response.data && e.response.data.error) {
                errorMessage = errorMessage + "{" + e.response.data.error + "}";
            }
            req.flash('error', errorMessage);
            return res.redirect("/buy/coins")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat - total});
        return res.redirect("/buy/coins");

    }else if (currency == "eth"){

        total = ethValue * amount;
        if (user.fiat < total) {
            req.flash("error", "You dont have enough fiat to perform the purchase");
            return res.redirect("/buy/coins");
        }
        try {
            await buyETH(amount, user.ethPublicKey);
            req.flash("success", "The transaction was a success! Thank you for your purchase")
        } catch (e) {
            req.flash("error", e.message)
            return res.redirect("/buy/coins")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat - total});
        return res.redirect("/buy/coins");
    }

    return res.redirect("/buy/coins");
});

router.post('/fiat',[
    body("amount").notEmpty().withMessage("Amount is empty").isNumeric().withMessage("Amount must be a number"),
    body("credit").notEmpty().withMessage("Credit card number is empty").isCreditCard().withMessage("Credit card number invalid"),
    body("cvc").notEmpty().withMessage("CVC is empty"),
    body("date").notEmpty().withMessage("Date is empty")
], async function (req: Request, res : Response){
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    const result = validationResult(req);
    if (!result.isEmpty()) {
        const errorMessages = result.formatWith(error => {
            if (error.msg != "Invalid value") {
                return error.msg as string
            }
        }).array();
        req.flash('error', errorMessages);
        return res.redirect("/buy/fiat");
    }
    // update just in case
    let user : UserDoc = await getUserByEmail(req.session.user.email);
    req.session.user = user;

    var {amount} = req.body;

    amount = Math.abs(amount);

    await updateUser(user._id.toString(), {fiat: user.fiat + amount});
    return res.redirect("/home")
});

// YOU CAN BUY FIAT THEN BUY BTC AND ETH WITH IT

export default router;