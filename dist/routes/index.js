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
Object.defineProperty(exports, "__esModule", { value: true });
const express_validator_1 = require("express-validator");
const userController_1 = require("../controllers/userController");
var express = require('express');
var router = express.Router();
/* GET login page. */
router.get('/', function (req, res, next) {
    res.render('login', { title: '256Bit', error: req.flash('error'),
        success: req.flash('success') });
});
router.get('/logout', function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        req.session.destroy((err) => {
            console.log(err);
        });
        res.redirect("/");
    });
});
router.post('/', [
    (0, express_validator_1.body)("email").isEmail(),
    (0, express_validator_1.body)("password").notEmpty()
], function (req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const result = (0, express_validator_1.validationResult)(req);
        if (!result.isEmpty()) {
            const errorMessages = "Invalid credentials, please verify that your information is valid and try again";
            req.flash('error', errorMessages);
            return res.redirect("/");
        }
        const { email, password } = req.body;
        let user = yield (0, userController_1.auth)(email, password);
        if (user == null) {
            const errorMessages = "Invalid credentials, please verify that your information is valid and try again";
            req.flash('error', errorMessages);
            return res.redirect("/");
        }
        req.session.isAuth = false;
        req.session.user = user;
        req.session.password = password;
        req.session.performedTwoFA = [""];
        if (user.isEmail2FA == true) {
            req.session.TwoFAType = "email";
            return res.redirect("/mfa");
        }
        if (user.isSMS2FA == true) {
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa");
        }
        if (user.isGoogle2FA == true) {
            req.session.TwoFAType = "google";
            return res.redirect("/mfa");
        }
        req.session.isAuth = true;
        return res.redirect("/home");
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map