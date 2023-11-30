import "express-session"
import {IUser} from "../models/user";
declare module "express-session" {
    interface SessionData {
        isAuth: boolean,
        user: IUser,
        password: string,
        btcValue: number,
        ethValue: number,
        TwoFACode: string,
        TwoFAType: string,
        performedTwoFA: [string],
        otp_url : string,
        tradeTx: any, // toAddress, currency, amount
        sellTx: any, // amount, currency
        txType : string
    }
}