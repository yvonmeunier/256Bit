import {NextFunction, Request, Response} from "express";
import {getBTCBalance, getETHBalance} from "../services/cryptoService";
import {getUserByEmail} from "../brokers/userBroker";
import {decryptSandwich} from "../services/cryptograhpy";
import crypto from "crypto";
import process from "process";

var express = require('express');
var router = express.Router();

router.get('/', async function(req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    // update just in case
    req.session.user = await getUserByEmail(req.session.user.email);
    let user = req.session.user;
    let password = req.session.password;
    let fiat = user.fiat.toFixed(2);
    let balanceETH = await getETHBalance(user.ethPublicKey);
    let balanceBTC = await getBTCBalance(user.btcPublicKey);
    let user_key = crypto.scryptSync(password, user.authentication.salt, 32);
    let server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);

    let btcPrivateKey = decryptSandwich(user.btcPrivateKey,user_key, server_key, user.iv);
    let ethPrivateKey = decryptSandwich(user.ethPrivateKey, user_key, server_key, user.iv);
    res.render('wallet', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, btcPrivateKey: btcPrivateKey, ethPrivateKey: ethPrivateKey, btcPublicKey: user.btcPublicKey, ethPublicKey: user.ethPublicKey});
});
export default router;