"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const express_validator_1 = require("express-validator");
const userBroker_1 = require("../brokers/userBroker");
const userController_1 = require("../controllers/userController");
const crypto = __importStar(require("crypto"));
const cryptoService_1 = require("../services/cryptoService");
const process = __importStar(require("process"));
const cryptograhpy_1 = require("../services/cryptograhpy");
var express = require('express');
var router = express.Router();
/* GET register page. */
router.get('/', function (req, res, next) {
    res.render('register', { title: '256Bit', error: req.flash('error'),
        success: req.flash('success') });
});
router.post('/', [
    (0, express_validator_1.body)("username").notEmpty().withMessage("The username is empty").escape(),
    (0, express_validator_1.body)("email").notEmpty().withMessage("The email is empty").isEmail().withMessage("The email is invalid").escape(),
    (0, express_validator_1.body)("password").notEmpty().withMessage("The password is empty").isLength({ min: 12 }).withMessage("The password must at least be 12 character long"),
    (0, express_validator_1.body)("confirm_password").notEmpty().withMessage("The confirm password is empty"),
], function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        // form validation
        const result = (0, express_validator_1.validationResult)(req);
        if (!result.isEmpty()) {
            const errorMessages = result.formatWith(error => {
                if (error.msg != "Invalid value") {
                    return error.msg;
                }
            }).array();
            req.flash('error', errorMessages);
            return res.redirect("/register");
        }
        const { username, email, password, confirm_password } = req.body;
        // some checks
        if (password != confirm_password) {
            req.flash('error', "The confirm password is not equal to the password");
            return res.redirect("/register");
        }
        let ver_user = yield (0, userBroker_1.getUserByEmail)(email);
        if (ver_user != null) {
            req.flash('error', "An account with the given email already exists, make sure you dont already have an account");
            return res.redirect("/register");
        }
        //create account
        let salt = crypto.randomBytes(16).toString("hex");
        let hashedPassword = (0, cryptograhpy_1.hashPassword)(password, salt);
        // create btc wallet
        var { btcPrivateKey, btcPublicKey } = (0, cryptoService_1.createBTCWallet)();
        // create eth wallet
        var { ethPrivateKey, ethPublicKey } = (0, cryptoService_1.createETHWallet)();
        // ENCRYPT PKs
        let iv = crypto.randomBytes(16);
        let user_key = crypto.scryptSync(password, salt, 32);
        let server_key = crypto.scryptSync(process.env.SERVER_KEY, salt, 32);
        let ethSandwichKey = (0, cryptograhpy_1.encryptSandwich)(ethPrivateKey, user_key, server_key, iv);
        let btcSandwichKey = (0, cryptograhpy_1.encryptSandwich)(btcPrivateKey, user_key, server_key, iv);
        let user = yield (0, userController_1.insertUser)({
            secret: "no",
            isEmail2FA: false, isGoogle2FA: false, isSMS2FA: false,
            authentication: { password: hashedPassword, salt: salt },
            btcPrivateKey: btcSandwichKey,
            btcPublicKey: btcPublicKey,
            ethPrivateKey: ethSandwichKey,
            ethPublicKey: ethPublicKey,
            iv: iv,
            fiat: 0,
            email: email,
            username: username
        });
        // check if everything is ok and redirect accordingly
        if (user == null) {
            req.flash('error', "An error occurred when creating your account, please try again later");
            return res.redirect("/register");
        }
        req.flash('success', "Your account has successfully been created");
        return res.redirect("/");
    });
});
exports.default = router;
//# sourceMappingURL=register.js.map