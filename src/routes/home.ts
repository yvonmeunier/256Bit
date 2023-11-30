import {NextFunction, Request, Response} from "express";
import {getBTCBalance, getBTCTxs, getETHBalance, getETHTxs} from "../services/cryptoService";
import {getUserByEmail} from "../brokers/userBroker";


var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', async function(req: Request, res: Response, next: NextFunction) {
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
    let BTCtxs = await getBTCTxs(user.btcPublicKey);
    let ETHtxs = await getETHTxs(user.ethPublicKey);
    // TODO : ETHtxs
    res.render('home', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, BTCtxs: BTCtxs, ETHtxs : ETHtxs, username: user.username, balanceFiat: fiat});
});

export default router;