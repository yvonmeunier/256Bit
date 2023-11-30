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
const userBroker_1 = require("../brokers/userBroker");
const cryptoService_1 = require("../services/cryptoService");
const userController_1 = require("../controllers/userController");
const crypto_1 = __importDefault(require("crypto"));
const process_1 = __importDefault(require("process"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const cryptograhpy_1 = require("../services/cryptograhpy");
var express = require('express');
var QRCode = require('qrcode');
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
        let fiat = user.fiat.toFixed(2);
        let balanceETH = yield (0, cryptoService_1.getETHBalance)(user.ethPublicKey);
        let balanceBTC = yield (0, cryptoService_1.getBTCBalance)(user.btcPublicKey);
        res.render('profile', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, isEmail2FA: user.isEmail2FA, isSMS2FA: user.isSMS2FA, isGoogle2FA: user.isGoogle2FA });
    });
});
router.get('/qr', function (req, res, next) {
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
        console.log(req.session.otp_url);
        if (req.session.otp_url == "no" || req.session.otp_url == null) {
            console.log("URL IS NULL BUDDY");
            req.flash("error", "OTP URL is empty, please make sure you enabled Google Auth 2FA beforehand");
            return res.redirect("/profile");
        }
        QRCode.toDataURL(req.session.otp_url, function (err, data_url) {
            req.session.otp_url = "no";
            return res.render('profile', { title: '256Bit', balanceBTC: balanceBTC, balanceETH: balanceETH, username: user.username, balanceFiat: fiat, url: data_url, isEmail2FA: user.isEmail2FA, isSMS2FA: user.isSMS2FA, isGoogle2FA: user.isGoogle2FA });
        });
    });
});
router.post('/', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        // update just in case
        let user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.session.user = user;
        const { username, oldPassword, password, confirmPassword, isEmail2FA, isSMS2FA, isGoogle2FA } = req.body;
        if (username != null) {
            yield (0, userController_1.updateUser)(user._id.toString(), { username: username });
        }
        if (password != "") {
            // wants to change password
            if (oldPassword != "" && confirmPassword != "") {
                // look if the form is properly filled
                if (oldPassword == req.session.password) {
                    // look if old password is right and that the new password is well new
                    if (confirmPassword == password && oldPassword != password && password.length >= 12) {
                        // decrypt the pks
                        var user_key = crypto_1.default.scryptSync(req.session.password, user.authentication.salt, 32);
                        var server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, user.authentication.salt, 32);
                        let btcPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.btcPrivateKey, user_key, server_key, user.iv);
                        let ethPrivateKey = (0, cryptograhpy_1.decryptSandwich)(user.ethPrivateKey, user_key, server_key, user.iv);
                        // encrypt them with the new password and a new iv
                        let salt = crypto_1.default.randomBytes(16).toString("hex");
                        let hashedPassword = (0, cryptograhpy_1.hashPassword)(password, salt);
                        let iv = crypto_1.default.randomBytes(16);
                        user_key = crypto_1.default.scryptSync(password, salt, 32);
                        server_key = crypto_1.default.scryptSync(process_1.default.env.SERVER_KEY, salt, 32);
                        // encrypt the pks
                        let ethSandwichKey = (0, cryptograhpy_1.encryptSandwich)(ethPrivateKey, user_key, server_key, iv);
                        let btcSandwichKey = (0, cryptograhpy_1.encryptSandwich)(btcPrivateKey, user_key, server_key, iv);
                        yield (0, userController_1.updateUser)(user._id.toString(), {
                            btcPrivateKey: btcSandwichKey,
                            ethPrivateKey: ethSandwichKey,
                            iv: iv,
                            authentication: {
                                password: hashedPassword,
                                salt: salt
                            }
                        });
                        req.session.password = password;
                    }
                    else {
                        req.flash("error", "The new password is the same as the old one, the confirm password is invalid or the new password is too short");
                        return res.redirect("/profile");
                    }
                }
                else {
                    req.flash("error", "Old password is invalid");
                    return res.redirect("/profile");
                }
            }
            else {
                req.flash("error", "Old password and/or the confirm password is empty");
                return res.redirect("/profile");
            }
        }
        if (isEmail2FA == "on") {
            yield (0, userController_1.updateUser)(user._id.toString(), { isEmail2FA: true });
        }
        else if (isEmail2FA == null && user.isEmail2FA) {
            yield (0, userController_1.updateUser)(user._id.toString(), { isEmail2FA: false });
        }
        if (isSMS2FA == "on") {
            yield (0, userController_1.updateUser)(user._id.toString(), { isSMS2FA: true });
        }
        else if (isSMS2FA == null && user.isSMS2FA) {
            yield (0, userController_1.updateUser)(user._id.toString(), { isSMS2FA: false });
        }
        if (isGoogle2FA == "on" && !user.isGoogle2FA) {
            // TODO: generate secret
            let secret = speakeasy_1.default.generateSecret();
            req.session.otp_url = secret.otpauth_url;
            yield (0, userController_1.updateUser)(user._id.toString(), { isGoogle2FA: true, secret: secret.base32 });
            return res.redirect("/profile/qr");
        }
        else if (isGoogle2FA == null && user.isGoogle2FA) {
            yield (0, userController_1.updateUser)(user._id.toString(), { isGoogle2FA: false, secret: "no" });
        }
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        req.flash("success", "Profile updated successfully!");
        return res.redirect("/profile");
    });
});
exports.default = router;
//# sourceMappingURL=profile.js.map