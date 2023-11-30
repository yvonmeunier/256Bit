import {NextFunction, Request, Response} from "express";
import {getUserByEmail} from "../brokers/userBroker";
import {getBTCBalance, getETHBalance} from "../services/cryptoService";
import {updateUser} from "../controllers/userController";
import {UserDoc} from "../models/user";
import crypto from "crypto";
import process from "process";
import speakeasy from "speakeasy";
import {decryptSandwich, encryptSandwich, hashPassword} from "../services/cryptograhpy";

var express = require('express');
var QRCode = require('qrcode')
var router = express.Router();

router.get('/', async function(req: Request, res: Response, next: NextFunction) {
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
    res.render('profile', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, isEmail2FA: user.isEmail2FA, isSMS2FA : user.isSMS2FA, isGoogle2FA : user.isGoogle2FA});
});

router.get('/qr', async function(req: Request, res: Response, next: NextFunction) {
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

    console.log(req.session.otp_url)
    if (req.session.otp_url == "no" || req.session.otp_url == null) {
        console.log("URL IS NULL BUDDY")
        req.flash("error", "OTP URL is empty, please make sure you enabled Google Auth 2FA beforehand")
        return res.redirect("/profile")
    }
     QRCode.toDataURL(req.session.otp_url, function (err: any, data_url: any) {
         req.session.otp_url = "no";
         return res.render('profile', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, url: data_url,isEmail2FA: user.isEmail2FA, isSMS2FA : user.isSMS2FA, isGoogle2FA : user.isGoogle2FA});
     });
});

router.post('/', async function(req: Request, res: Response, next: NextFunction) {
    if (!req.session.isAuth || req.session.user == null) {
        req.flash('error', "You must be logged in to access this page");
        return res.redirect("/");
    }
    // update just in case
    let user : UserDoc = await getUserByEmail(req.session.user.email);
    req.session.user = user;

    const {username, oldPassword, password, confirmPassword, isEmail2FA, isSMS2FA, isGoogle2FA} = req.body;

    if (username != null) {
        await updateUser(user._id.toString(), {username: username})
    }
    if (password != "") {
        // wants to change password
        if (oldPassword != "" && confirmPassword != "") {
            // look if the form is properly filled
            if (oldPassword == req.session.password) {
                // look if old password is right and that the new password is well new
                if (confirmPassword == password && oldPassword != password && password.length >= 12) {
                    // decrypt the pks
                    var user_key = crypto.scryptSync(req.session.password, user.authentication.salt, 32);
                    var server_key = crypto.scryptSync(process.env.SERVER_KEY, user.authentication.salt, 32);
                    let btcPrivateKey = decryptSandwich(user.btcPrivateKey,user_key, server_key, user.iv);
                    let ethPrivateKey = decryptSandwich(user.ethPrivateKey, user_key, server_key, user.iv);

                    // encrypt them with the new password and a new iv
                    let salt = crypto.randomBytes(16).toString("hex");
                    let hashedPassword = hashPassword(password, salt);

                    let iv = crypto.randomBytes(16);
                    user_key = crypto.scryptSync(password, salt, 32);
                    server_key = crypto.scryptSync(process.env.SERVER_KEY, salt, 32);
                    // encrypt the pks
                    let ethSandwichKey = encryptSandwich(ethPrivateKey, user_key, server_key, iv);
                    let btcSandwichKey = encryptSandwich(btcPrivateKey, user_key, server_key, iv);

                    await updateUser(user._id.toString(), {
                        btcPrivateKey: btcSandwichKey,
                        ethPrivateKey: ethSandwichKey,
                        iv: iv,
                        authentication: {
                            password: hashedPassword,
                            salt: salt
                        }
                    });
                    req.session.password = password;
                } else {
                    req.flash("error", "The new password is the same as the old one, the confirm password is invalid or the new password is too short");
                    return res.redirect("/profile");
                }
            } else {
                req.flash("error", "Old password is invalid");
                return res.redirect("/profile");
            }
        } else {
            req.flash("error", "Old password and/or the confirm password is empty");
            return res.redirect("/profile");
        }
    }

    if (isEmail2FA == "on") {
        await updateUser(user._id.toString(), {isEmail2FA: true})
    } else if (isEmail2FA == null && user.isEmail2FA){
        await updateUser(user._id.toString(), {isEmail2FA: false})
    }

    if (isSMS2FA == "on") {
        await updateUser(user._id.toString(), {isSMS2FA: true})
    } else if (isSMS2FA == null && user.isSMS2FA) {
        await updateUser(user._id.toString(), {isSMS2FA: false})
    }

    if (isGoogle2FA == "on" && !user.isGoogle2FA) {
        // TODO: generate secret
        let secret = speakeasy.generateSecret();
        req.session.otp_url = secret.otpauth_url;
        await updateUser(user._id.toString(), {isGoogle2FA: true, secret: secret.base32});
        return res.redirect("/profile/qr");
    } else if (isGoogle2FA == null && user.isGoogle2FA){
        await updateUser(user._id.toString(), {isGoogle2FA: false, secret: "no"});
    }
    req.session.user = await getUserByEmail(req.session.user.email);
    req.flash("success", "Profile updated successfully!");
    return res.redirect("/profile");
})

export default router;