import crypto from "crypto";
import process from "process";

export const hashPassword = (password: string, salt: string) => {
    return crypto.pbkdf2Sync(password + process.env.PEPPER, salt, 872791, 32, "sha256").toString("hex");
}

export const encryptSandwich = (message: string, user_key: Buffer,server_key: Buffer, iv: Buffer) => {
    let userCipher = crypto.createCipheriv("aes-256-cbc", user_key, iv);
    let encryptedKey = userCipher.update(message, "utf-8", "hex");
    encryptedKey += userCipher.final("hex")
    console.log("ENCRYPTED : " + encryptedKey);
    let serverCipher = crypto.createCipheriv("aes-256-cbc", server_key, iv);
    let sandwichedKey = serverCipher.update(encryptedKey, "hex", "hex");
    sandwichedKey += serverCipher.final("hex");
    console.log("SANDWICH : " + sandwichedKey);
    return sandwichedKey;
};
export const decryptSandwich = (cipher: string, user_key: Buffer,server_key: Buffer, iv: Buffer) => {
    let serverDecipher = crypto.createDecipheriv("aes-256-cbc", server_key, iv);
    let desandwichedKey = serverDecipher.update(cipher, "hex", "hex");
    desandwichedKey += serverDecipher.final("hex");
    console.log("DESANDWICHED : " + desandwichedKey);
    let userDecipher = crypto.createDecipheriv("aes-256-cbc", user_key, iv);
    let decryptedKey = userDecipher.update(desandwichedKey, "hex", "utf-8");
    decryptedKey += userDecipher.final("utf-8");
    console.log("DECRYPTED : " + decryptedKey);
    return decryptedKey;
};