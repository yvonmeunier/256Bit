import {NextFunction, Request, Response} from "express";
import {body, validationResult} from "express-validator";
import {auth} from "../controllers/userController";
var express = require('express');
var router = express.Router();

/* GET login page. */
router.get('/', function(req: Request, res: Response, next: NextFunction) {
  res.render('login', { title: '256Bit', error: req.flash('error'),
      success: req.flash('success') });
});

router.get('/logout', async function(req: Request, res: Response, next: NextFunction) {
    req.session.destroy((err) => {
        console.log(err);
    });
    res.redirect("/");
});

router.post('/',
    [
        body("email").isEmail(),
        body("password").notEmpty()
    ],
    async function(req: Request, res: Response, next: NextFunction) {
        const result = validationResult(req);
        if (!result.isEmpty()) {
            const errorMessages = "Invalid credentials, please verify that your information is valid and try again"
            req.flash('error', errorMessages);
            return res.redirect("/");
        }
        const {email, password} = req.body;
        let user = await auth(email, password);
        if (user == null) {
            const errorMessages = "Invalid credentials, please verify that your information is valid and try again"
            req.flash('error', errorMessages);
            return res.redirect("/");
        }
        req.session.isAuth = false;
        req.session.user = user;
        req.session.password = password;
        req.session.performedTwoFA = [""];
        if (user.isEmail2FA == true) {
            req.session.TwoFAType = "email";
            return res.redirect("/mfa")
        }
        if (user.isSMS2FA == true) {
            req.session.TwoFAType = "sms";
            return res.redirect("/mfa")
        }
        if (user.isGoogle2FA == true) {
            req.session.TwoFAType = "google";
            return res.redirect("/mfa")
        }

        req.session.isAuth = true;

        return res.redirect("/home");
    });
export default router;