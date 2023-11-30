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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const express_session_1 = __importDefault(require("express-session"));
const morgan_1 = __importDefault(require("morgan"));
const connect_flash_1 = __importDefault(require("connect-flash"));
//add dependencies : hashing, session, cryptography, mongodb.
const mongoose_1 = __importDefault(require("mongoose"));
// add controllers (routers)
const routes_1 = __importDefault(require("./routes"));
const register_1 = __importDefault(require("./routes/register"));
const home_1 = __importDefault(require("./routes/home"));
const buy_1 = __importDefault(require("./routes/buy"));
const wallet_1 = __importDefault(require("./routes/wallet"));
const trade_1 = __importDefault(require("./routes/trade"));
const mfa_1 = __importDefault(require("./routes/mfa"));
const profile_1 = __importDefault(require("./routes/profile"));
const sell_1 = __importDefault(require("./routes/sell"));
const process = __importStar(require("process"));
var app = (0, express_1.default)();
// view engine setup
app.set('views', path_1.default.join('src', 'views'));
app.set('view engine', 'pug');
//session
app.use((0, express_session_1.default)({
    secret: 'cryptomancer',
    saveUninitialized: true,
    resave: true
}));
process.env.PEPPER = "d981a1b19fc62ac7927b9bef82e2617a1c186b502ce3b5e6ea4ef76efd9acc90";
process.env.SERVER_KEY = "7194f4284123596812dfbb40d1a87adcdea3897895d499f12067faa760c7f7fa";
process.env.SENDGRID = "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";
process.env.SID = "AC8765eb36ca0f78df9b373d79d3768296";
process.env.AUTHTOKEN = "34c513e36719332dc8397731f7cc43fe";
// add front end libraries stuff here
app.use("/css", express_1.default.static(path_1.default.join(__dirname, "../node_modules/bootstrap/dist/css")));
app.use("/js", express_1.default.static(path_1.default.join(__dirname, "../node_modules/particles.js")));
app.use("/js", express_1.default.static(path_1.default.join(__dirname, "../node_modules/@popperjs/core/dist/umd")));
app.use("/js", express_1.default.static(path_1.default.join(__dirname, "../node_modules/jquery/dist")));
app.use("/js", express_1.default.static(path_1.default.join(__dirname, "../node_modules/bootstrap/dist/js")));
app.use("/js", express_1.default.static(path_1.default.join(__dirname, "../node_modules/chart.js/dist")));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use((0, connect_flash_1.default)());
app.use(express_1.default.static(path_1.default.join('dist', 'public')));
app.use(express_1.default.static(path_1.default.join('src', 'public')));
// use controller routes with prefix
app.use('/', routes_1.default);
app.use('/register', register_1.default);
app.use('/home', home_1.default);
app.use('/mfa', mfa_1.default);
app.use('/trade', trade_1.default);
app.use('/buy', buy_1.default);
app.use('/wallet', wallet_1.default);
app.use('/profile', profile_1.default);
app.use('/sell', sell_1.default);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});
// mongoose
const DB_URL = 'mongodb://test_app_database/Users';
mongoose_1.default.Promise = Promise;
mongoose_1.default.connect(DB_URL);
mongoose_1.default.connection.on('error', (error) => {
    console.log(error);
});
module.exports = app;
//# sourceMappingURL=app.js.map