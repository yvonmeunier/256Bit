import {NextFunction, Request, Response} from "express";
import {
    buyBTC,
    buyETH,
    getBTCBalance,
    getBTCValue,
    getETHBalance,
    getETHValue, sendBTC, sendETH
} from "../services/cryptoService";
import {getUserByEmail} from "../brokers/userBroker";

var express = require('express');
import {body, validationResult} from "express-validator";
import {UserDoc} from "../models/user";
import {updateUser} from "../controllers/userController";
import crypto from "crypto";
import process from "process";
import {decryptSandwich} from "../services/cryptograhpy";

var router = express.Router();

router.get('/', async function (req: Request, res: Response, next: NextFunction) {
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

router.get('/perform', async function (req: Request, res: Response, next: NextFunction) {

    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    // update just in case
    let user: UserDoc = await getUserByEmail(req.session.user.email);
    req.session.user = user;

    if (req.session.sellTx == null) {
        req.flash('error', "MFA Failed");
        return res.redirect("/sell");
    }

    const {amount, currency} = req.session.sellTx;

    let btcValue = req.session.btcValue;
    let ethValue = req.session.ethValue;
    let password = req.session.password;
    var total;
    let userBTCs = await getBTCBalance(user.btcPublicKey);
    let userETHs = await getETHBalance(user.ethPublicKey);
    let user_key = crypto.scryptSync(password, user.authentication.salt, 32);
    let server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);

    let btcPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
    let ethPrivateKey = decryptSandwich(user.ethPrivateKey, user_key, server_key, user.iv);

    if (currency == "btc") {
        total = btcValue * amount;
        if (userBTCs < amount) {
            req.flash("error", "You dont have enough btcs to perform the transaction");
            return res.redirect("/sell");
        }
        try {
            await sendBTC(user.btcPublicKey, "midEHcrxHPU2j1YdAA7D5qUqCw2sRXRtHN", btcPrivateKey, amount)
            req.flash("success", "The transaction was a success!")
        } catch (e) {
            let errorMessage = e.message;
            console.log(errorMessage);
            if (e.response && e.response.data && e.response.data.error) {
                errorMessage = errorMessage + "{" + e.response.data.error + "}";
            }
            req.flash('error', errorMessage);
            return res.redirect("/sell")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat + total});
        return res.redirect("/sell");

    } else if (currency == "eth") {

        total = ethValue * amount;
        if (userETHs < amount) {
            req.flash("error", "You dont have enough eths to perform the transaction");
            return res.redirect("/sell");
        }
        try {
            await sendETH(user.ethPublicKey, ethPrivateKey, "0xe3041C08581Fc4F85C149deA23dcB5b60057f5B5", amount)
            req.flash("success", "The transaction was a success!")
        } catch (e) {
            req.flash("error", e.message)
            return res.redirect("/sell")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat + total});
        return res.redirect("/sell");
    }

    return res.redirect("/sell");


})

router.post('/', [
    body("amount").notEmpty().withMessage("The amount must be specified").isNumeric().withMessage("The amount must be a number"),
    body("currency").notEmpty().withMessage("ERROR : Currency not specified!!! R U A HAXXOR? 💀")
    ],
    async function (req: Request, res: Response) {
    // do the sell thing
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
    let user: UserDoc = await getUserByEmail(req.session.user.email);
    req.session.user = user;

    const {amount, currency} = req.body;

    req.session.performedTwoFA = [""];
    if (user.isEmail2FA == true) {
        req.session.sellTx = {amount, currency};
        req.session.txType = "sell";
        req.session.TwoFAType = "email";
        return res.redirect("/mfa/tx")
    }
    if (user.isSMS2FA == true) {
        req.session.sellTx = { amount, currency};
        req.session.txType = "sell";
        req.session.TwoFAType = "sms";
        return res.redirect("/mfa/tx")
    }
    if (user.isGoogle2FA == true) {
        req.session.sellTx = {amount, currency};
        req.session.txType = "sell";
        req.session.TwoFAType = "google";
        return res.redirect("/mfa/tx")
    }

    let btcValue = req.session.btcValue;
    let ethValue = req.session.ethValue;
    let password = req.session.password;
    var total;
    let userBTCs = await getBTCBalance(user.btcPublicKey);
    let userETHs = await getETHBalance(user.ethPublicKey);
    let user_key = crypto.scryptSync(password, user.authentication.salt, 32);
    let server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);

    let btcPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
    let ethPrivateKey = decryptSandwich(user.ethPrivateKey, user_key, server_key, user.iv);

    if (currency == "btc") {
        total = btcValue * amount;
        if (userBTCs < amount) {
            req.flash("error", "You dont have enough btcs to perform the transaction");
            return res.redirect("/sell");
        }
        try {
            await sendBTC(user.btcPublicKey, "midEHcrxHPU2j1YdAA7D5qUqCw2sRXRtHN", btcPrivateKey, amount)
            req.flash("success", "The transaction was a success!")
        } catch (e) {
            let errorMessage = e.message;
            console.log(errorMessage);
            if (e.response && e.response.data && e.response.data.error) {
                errorMessage = errorMessage + "{" + e.response.data.error + "}";
            }
            req.flash('error', errorMessage);
            return res.redirect("/sell")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat + total});
        return res.redirect("/sell");

    } else if (currency == "eth") {

        total = ethValue * amount;
        if (userETHs < amount) {
            req.flash("error", "You dont have enough eths to perform the transaction");
            return res.redirect("/sell");
        }
        try {
            await sendETH(user.ethPublicKey, ethPrivateKey, "0xe3041C08581Fc4F85C149deA23dcB5b60057f5B5", amount)
            req.flash("success", "The transaction was a success!")
        } catch (e) {
            req.flash("error", e.message)
            return res.redirect("/sell")
        }
        await updateUser(user._id.toString(), {fiat: user.fiat + total});
        return res.redirect("/sell");
    }

    return res.redirect("/sell");

});
export default router;