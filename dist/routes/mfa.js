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
const crypto_1 = __importDefault(require("crypto"));
const speakeasy_1 = __importDefault(require("speakeasy"));
const userBroker_1 = require("../brokers/userBroker");
var express = require('express');
var router = express.Router();
const sgMail = require('@sendgrid/mail');
const client = require('twilio')('AC8765eb36ca0f78df9b373d79d3768296', '34c513e36719332dc8397731f7cc43fe');
sgMail.setApiKey("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");
router.get('/', function (req, res, next) {
    let user = req.session.user;
    if (user == null) {
        return res.redirect("/");
    }
    let type = req.session.TwoFAType;
    let n = crypto_1.default.randomInt(0, 1000000);
    req.session.TwoFACode = n.toString().padStart(6, "0");
    // order : email, sms, google
    switch (type) {
        case "sms":
            sendSMS(req.session.TwoFACode);
            break;
        case "email":
            sendEmail(req.session.TwoFACode);
            break;
    }
    return res.render('mfa', { title: '256Bit', type: type, isTX: false });
});
router.get('/tx', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!req.session.isAuth || req.session.user == null) {
            req.flash('error', "You must be logged in to access this page");
            return res.redirect("/");
        }
        // update just in case
        req.session.user = yield (0, userBroker_1.getUserByEmail)(req.session.user.email);
        let user = req.session.user;
        let type = req.session.TwoFAType;
        let n = crypto_1.default.randomInt(0, 1000000);
        req.session.TwoFACode = n.toString().padStart(6, "0");
        // order : email, sms, google
        switch (type) {
            case "sms":
                sendSMS(req.session.TwoFACode);
                break;
            case "email":
                sendEmail(req.session.TwoFACode);
                break;
        }
        return res.render('mfa', { title: '256Bit', type: type, isTX: true });
    });
});
router.post('/', function (req, res) {
    let user = req.session.user;
    if (user == null) {
        return res.redirect("/logout");
    }
    const { code } = req.body;
    console.log(code);
    if (req.session.TwoFAType == "google") {
        var secret = user.secret;
        var verified = speakeasy_1.default.totp.verify({ secret: secret,
            encoding: 'base32',
            token: code });
        if (verified) {
            req.session.performedTwoFA.push(req.session.TwoFAType);
            if (user.isSMS2FA && req.session.performedTwoFA.indexOf("sms") == -1) {
                req.session.TwoFAType = "sms";
                return res.redirect("/mfa");
            }
            if (user.isEmail2FA && req.session.performedTwoFA.indexOf("email") == -1) {
                req.session.TwoFAType = "email";
                return res.redirect("/mfa");
            }
            req.session.isAuth = true;
            req.session.performedTwoFA = [""];
            return res.redirect("/home");
        }
    }
    if (code == req.session.TwoFACode) {
        // add mfa type to array so we dont perform it 2 times
        req.session.performedTwoFA.push(req.session.TwoFAType);
        if (user.isSMS2FA && req.session.performedTwoFA.indexOf("sms") == -1) {
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa");
        }
        if (user.isEmail2FA && req.session.performedTwoFA.indexOf("email") == -1) {
            req.session.TwoFAType = "email";
            return res.redirect("/mfa");
        }
        if (user.isGoogle2FA && req.session.performedTwoFA.indexOf("google") == -1) {
            req.session.TwoFAType = "google";
            return res.redirect("/mfa");
        }
        req.session.isAuth = true;
        req.session.performedTwoFA = [""];
        return res.redirect("/home");
    }
    return res.redirect("/logout");
});
router.post('/tx', function (req, res) {
    let user = req.session.user;
    if (user == null) {
        return res.redirect("/logout");
    }
    const { code } = req.body;
    console.log(code);
    if (req.session.TwoFAType == "google") {
        var secret = user.secret;
        var verified = speakeasy_1.default.totp.verify({ secret: secret,
            encoding: 'base32',
            token: code });
        if (verified) {
            req.session.performedTwoFA.push(req.session.TwoFAType);
            if (user.isSMS2FA && req.session.performedTwoFA.indexOf("sms") == -1) {
                req.session.TwoFAType = "sms";
                return res.redirect("/mfa/tx");
            }
            if (user.isEmail2FA && req.session.performedTwoFA.indexOf("email") == -1) {
                req.session.TwoFAType = "email";
                return res.redirect("/mfa/tx");
            }
            if (req.session.txType == "trade") {
                return res.redirect("/trade/perform");
            }
            if (req.session.txType == "sell") {
                return res.redirect("/sell/perform");
            }
        }
    }
    if (code == req.session.TwoFACode) {
        // add mfa type to array so we dont perform it 2 times
        req.session.performedTwoFA.push(req.session.TwoFAType);
        if (user.isSMS2FA && req.session.performedTwoFA.indexOf("sms") == -1) {
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa");
        }
        if (user.isEmail2FA && req.session.performedTwoFA.indexOf("email") == -1) {
            req.session.TwoFAType = "email";
            return res.redirect("/mfa");
        }
        if (user.isGoogle2FA && req.session.performedTwoFA.indexOf("google") == -1) {
            req.session.TwoFAType = "google";
            return res.redirect("/mfa");
        }
        //TODO : PERFORM TX
        if (req.session.txType == "trade") {
            return res.redirect("/trade/perform");
        }
        if (req.session.txType == "sell") {
            return res.redirect("/sell/perform");
        }
    }
    //TODO: CANCEL TX
    req.session.tradeTx = null;
    req.session.sellTx = null;
    req.session.txType = "";
    return res.redirect("/home");
});
function sendEmail(pin) {
    // the email is hardcoded so I dont have to create emails over and over... rip my inbox tho
    const msg = {
        to: 'meunieryvon6@gmail.com',
        from: 'meunieryvon6@gmail.com',
        subject: '256Bit | 2FA Code',
        text: pin,
        html: '<strong>' + pin + '</strong>',
    };
    sgMail
        .send(msg)
        .then(() => {
        console.log('Email sent');
    })
        .catch((error) => {
        console.error(error);
    });
}
function sendSMS(pin) {
    client.messages
        .create({
        body: pin,
        from: '+12513331245',
        to: '+15145069273'
    });
}
exports.default = router;
//# sourceMappingURL=mfa.js.map