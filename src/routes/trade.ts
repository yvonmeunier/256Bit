import {NextFunction, Request, Response} from "express";
import {decryptSandwich} from "../services/cryptograhpy";
import crypto from "crypto";
import process from "process";
import {body, validationResult} from "express-validator";
import {getBTCBalance, getETHBalance, sendBTC, sendETH} from "../services/cryptoService";

var express = require('express');
const bitcore = require("bitcore-lib");
import {Web3} from 'web3';
import {getUserByEmail} from "../brokers/userBroker";

const network = "https://sepolia.infura.io/v3/a94bac4045aa4899bd0f1c8411b4a63a";
const web3 = new Web3(new Web3.providers.HttpProvider(network))
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
    let fiat = user.fiat.toFixed(2);
    res.render('trade', {
        title: '256Bit',
        balanceBTC: balanceBTC,
        balanceETH: balanceETH,
        username: user.username,
        balanceFiat: fiat
    });
});

router.post('/', [
        body("toAddress").notEmpty().withMessage("The target address is empty"),
        body("amount").notEmpty().withMessage("Amount unspecified")],
    async function (req: Request, res: Response) {
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
            return res.redirect("/trade");
        }

        const {toAddress, amount, currency} = req.body;
        req.session.user = await getUserByEmail(req.session.user.email);
        let user = req.session.user;

        //TODO: MFA CHECK
        req.session.performedTwoFA = [""];
        if (user.isEmail2FA == true) {
            req.session.tradeTx = {toAddress, amount, currency};
            req.session.txType = "trade";
            req.session.TwoFAType = "email";
            return res.redirect("/mfa/tx")
        }
        if (user.isSMS2FA == true) {
            req.session.tradeTx = {toAddress, amount, currency};
            req.session.txType = "trade";
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa/tx")
        }
        if (user.isGoogle2FA == true) {
            req.session.tradeTx = {toAddress, amount, currency};
            req.session.txType = "trade";
            req.session.TwoFAType = "google";
            return res.redirect("/mfa/tx")
        }

        let password = req.session.password;
        let user_key = crypto.scryptSync(password, user.authentication.salt, 32);
        let server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);
        let btcPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
        let ethPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
        if (currency == "btc") {

            if (!bitcore.Address.isValid(toAddress, bitcore.Networks.testnet)) {
                req.flash('error', "The recipient address must be valid.");
                res.redirect("/trade");
                return;
            }
            try {
                await sendBTC(user.btcPublicKey, btcPrivateKey, toAddress, amount);
                req.flash('success', amount + " BTC sent successfully to " + toAddress
                    + ". I may take up to few minutes before the transaction is completed.");
                res.redirect("/trade");
            } catch (e) {
                let errorMessage = e.message;
                console.log(errorMessage);
                if (e.response && e.response.data && e.response.data.error) {
                    errorMessage = errorMessage + "{" + e.response.data.error + "}";
                }
                req.flash('error', errorMessage);
                res.redirect("/trade")
            }
        } else if (currency == "eth") {
            if (!web3.utils.isAddress(toAddress)) {
                req.flash("error", "the address is invalid bozo")
                res.redirect("/trade")
                return;
            }
            try {
                let txId = await sendETH(user.ethPublicKey, ethPrivateKey, toAddress, amount);
                req.flash('success', amount + " ETH sent successfully to " + toAddress
                    + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'> Transaction #" + txId + "</a>");
                res.redirect("/trade");
            } catch (e) {
                req.flash("error", e.message)
                res.redirect("/trade");
            }
        }

    });

router.get('/perform', async function (req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }

    if (req.session.tradeTx == null) {
        req.flash('error', "MFA Failed");
        return res.redirect("/trade");
    }


    const {toAddress, amount, currency} = req.session.tradeTx;

    req.session.user = await getUserByEmail(req.session.user.email);
    let user = req.session.user;

    let password = req.session.password;
    let user_key = crypto.scryptSync(password, user.authentication.salt, 32);
    let server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);
    let btcPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
    let ethPrivateKey = decryptSandwich(user.btcPrivateKey, user_key, server_key, user.iv);
    if (currency == "btc") {

        if (!bitcore.Address.isValid(toAddress, bitcore.Networks.testnet)) {
            req.flash('error', "The recipient address must be valid.");
            res.redirect("/trade");
            return;
        }
        try {
            await sendBTC(user.btcPublicKey, btcPrivateKey, toAddress, amount);
            req.flash('success', amount + " BTC sent successfully to " + toAddress
                + ". I may take up to few minutes before the transaction is completed.");
            res.redirect("/trade");
        } catch (e) {
            let errorMessage = e.message;
            console.log(errorMessage);
            if (e.response && e.response.data && e.response.data.error) {
                errorMessage = errorMessage + "{" + e.response.data.error + "}";
            }
            req.flash('error', errorMessage);
            res.redirect("/trade")
        }
    } else if (currency == "eth") {
        if (!web3.utils.isAddress(toAddress)) {
            req.flash("error", "the address is invalid bozo")
            res.redirect("/trade")
            return;
        }
        try {
            let txId = await sendETH(user.ethPublicKey, ethPrivateKey, toAddress, amount);
            req.flash('success', amount + " ETH sent successfully to " + toAddress
                + ". <a target='_blank' href='https://sepolia.etherscan.io/tx/" + txId + "'> Transaction #" + txId + "</a>");
            res.redirect("/trade");
        } catch (e) {
            req.flash("error", e.message)
            res.redirect("/trade");
        }
    }

})

export default router;