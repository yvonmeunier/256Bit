"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptSandwich = exports.encryptSandwich = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const process_1 = __importDefault(require("process"));
const hashPassword = (password, salt) => {
    return crypto_1.default.pbkdf2Sync(password + process_1.default.env.PEPPER, salt, 872791, 32, "sha256").toString("hex");
};
exports.hashPassword = hashPassword;
const encryptSandwich = (message, user_key, server_key, iv) => {
    let userCipher = crypto_1.default.createCipheriv("aes-256-cbc", user_key, iv);
    let encryptedKey = userCipher.update(message, "utf-8", "hex");
    encryptedKey += userCipher.final("hex");
    console.log("ENCRYPTED : " + encryptedKey);
    let serverCipher = crypto_1.default.createCipheriv("aes-256-cbc", server_key, iv);
    let sandwichedKey = serverCipher.update(encryptedKey, "hex", "hex");
    sandwichedKey += serverCipher.final("hex");
    console.log("SANDWICH : " + sandwichedKey);
    return sandwichedKey;
};
exports.encryptSandwich = encryptSandwich;
const decryptSandwich = (cipher, user_key, server_key, iv) => {
    let serverDecipher = crypto_1.default.createDecipheriv("aes-256-cbc", server_key, iv);
    let desandwichedKey = serverDecipher.update(cipher, "hex", "hex");
    desandwichedKey += serverDecipher.final("hex");
    console.log("DESANDWICHED : " + desandwichedKey);
    let userDecipher = crypto_1.default.createDecipheriv("aes-256-cbc", user_key, iv);
    let decryptedKey = userDecipher.update(desandwichedKey, "hex", "utf-8");
    decryptedKey += userDecipher.final("utf-8");
    console.log("DECRYPTED : " + decryptedKey);
    return decryptedKey;
};
exports.decryptSandwich = decryptSandwich;
//# sourceMappingURL=cryptograhpy.js.map