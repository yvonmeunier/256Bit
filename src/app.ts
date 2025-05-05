import createError from 'http-errors';
import express, {Request, Response, NextFunction} from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import session from "express-session";
import logger from 'morgan';
import flash from "connect-flash";

//add dependencies : hashing, session, cryptography, mongodb.
import mongoose from "mongoose";

// add controllers (routers)
import indexRouter from './routes';
import registerRouter from "./routes/register";
import homeRouter from "./routes/home";
import buyRouter from "./routes/buy";
import walletRouter from "./routes/wallet";
import tradeRouter from "./routes/trade";
import mfaRouter from "./routes/mfa";
import profileRouter from "./routes/profile";
import sellRouter from "./routes/sell";
import * as process from "process";



var app = express();

// view engine setup
app.set('views', path.join('src', 'views'));
app.set('view engine', 'pug');

//session
app.use(session({
  secret: 'cryptomancer',
  saveUninitialized: true,
  resave: true
}));

process.env.PEPPER = "d981a1b19fc62ac7927b9bef82e2617a1c186b502ce3b5e6ea4ef76efd9acc90";
process.env.SERVER_KEY = "7194f4284123596812dfbb40d1a87adcdea3897895d499f12067faa760c7f7fa";
process.env.SENDGRID = "";
process.env.SID = "";
process.env.AUTHTOKEN = "";


// add front end libraries stuff here
app.use(
    "/css",
    express.static(path.join(__dirname, "../node_modules/bootstrap/dist/css"))
)
app.use(
    "/js",
    express.static(path.join(__dirname, "../node_modules/particles.js"))
)

app.use(
    "/js",
    express.static(path.join(__dirname, "../node_modules/@popperjs/core/dist/umd"))
)
app.use(
    "/js",
    express.static(path.join(__dirname, "../node_modules/jquery/dist"))
)
app.use(
    "/js",
    express.static(path.join(__dirname, "../node_modules/bootstrap/dist/js"))
)
app.use(
    "/js",
    express.static(path.join(__dirname, "../node_modules/chart.js/dist"))
)

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(flash());
app.use(express.static(path.join('dist', 'public')));
app.use(express.static(path.join('src', 'public')));


// use controller routes with prefix
app.use('/', indexRouter);
app.use('/register', registerRouter);
app.use('/home', homeRouter);
app.use('/mfa', mfaRouter);
app.use('/trade', tradeRouter);
app.use('/buy', buyRouter);
app.use('/wallet', walletRouter);
app.use('/profile', profileRouter);
app.use('/sell', sellRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// mongoose
const DB_URL = 'mongodb://test_app_database/Users';

mongoose.Promise = Promise;
mongoose.connect(DB_URL);
mongoose.connection.on('error', (error: Error) => {
  console.log(error);
});
module.exports = app;
