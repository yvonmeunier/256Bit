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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertUser = exports.updateUser = exports.auth = void 0;
const userBroker_1 = require("../brokers/userBroker");
const crypto = __importStar(require("crypto"));
const process_1 = __importDefault(require("process"));
const auth = (email, password) => __awaiter(void 0, void 0, void 0, function* () {
    let user = yield (0, userBroker_1.getUserByEmail)(email);
    if (user == null) {
        return;
    }
    let hashedPassword = crypto.pbkdf2Sync(password + process_1.default.env.PEPPER, user.authentication.salt, 872791, 32, "sha256").toString("hex");
    if (hashedPassword != user.authentication.password) {
        return;
    }
    return user;
});
exports.auth = auth;
const updateUser = (id, values) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, userBroker_1.updateUserById)(id, values);
});
exports.updateUser = updateUser;
const insertUser = (user) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield (0, userBroker_1.createUser)(user);
    }
    catch (error) {
        console.log(error);
        return;
    }
});
exports.insertUser = insertUser;
//# sourceMappingURL=userController.js.map