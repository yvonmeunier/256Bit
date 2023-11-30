import {NextFunction, Request, Response} from "express";
import {body, validationResult} from "express-validator";
import {getUserByEmail} from "../brokers/userBroker";
import {insertUser} from "../controllers/userController";
import * as crypto from "crypto";
import {createBTCWallet, createETHWallet} from "../services/cryptoService";
import * as process from "process";
import {IUser} from "../models/user";
import {decryptSandwich, encryptSandwich, hashPassword} from "../services/cryptograhpy";

var express = require('express');
var router = express.Router();

/* GET register page. */
router.get('/', function(req: Request, res: Response, next: NextFunction) {
    res.render('register', { title: '256Bit', error: req.flash('error'),
        success: req.flash('success')});
});
router.post('/',
    [
        body("username").notEmpty().withMessage("The username is empty").escape(),
        body("email").notEmpty().withMessage("The email is empty").isEmail().withMessage("The email is invalid").escape(),
        body("password").notEmpty().withMessage("The password is empty").isLength({min:12}).withMessage("The password must at least be 12 character long"),
        body("confirm_password").notEmpty().withMessage("The confirm password is empty"),
    ],
    async function(req: Request, res: Response, next: NextFunction) {
        // form validation
        const result = validationResult(req);
        if (!result.isEmpty()) {
            const errorMessages = result.formatWith(error => {
                if (error.msg != "Invalid value") {
                    return error.msg as string
                }
            }).array();
            req.flash('error', errorMessages);
            return res.redirect("/register");
        }

        const {username, email, password, confirm_password} = req.body;

        // some checks
        if (password != confirm_password) {
            req.flash('error', "The confirm password is not equal to the password");
            return res.redirect("/register");
        }
        let ver_user : IUser = await getUserByEmail(email);
        if (ver_user != null) {
            req.flash('error', "An account with the given email already exists, make sure you dont already have an account");
            return res.redirect("/register");
        }

        //create account

        let salt = crypto.randomBytes(16).toString("hex");
        let hashedPassword = hashPassword(password, salt);

        // create btc wallet
        var {btcPrivateKey, btcPublicKey} = createBTCWallet();

        // create eth wallet
        var {ethPrivateKey, ethPublicKey} = createETHWallet();

        // ENCRYPT PKs
        let iv = crypto.randomBytes(16);
        let user_key = crypto.scryptSync(password, salt, 32);
        let server_key = crypto.scryptSync(process.env.SERVER_KEY, salt, 32);

        let ethSandwichKey = encryptSandwich(ethPrivateKey, user_key, server_key, iv);
        let btcSandwichKey = encryptSandwich(btcPrivateKey, user_key, server_key, iv);

        let user = await insertUser({
            secret: "no",
            isEmail2FA: false, isGoogle2FA: false, isSMS2FA: false,
            authentication: {password: hashedPassword, salt: salt},
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

export default router;