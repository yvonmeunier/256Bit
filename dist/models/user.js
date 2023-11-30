"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// its the table
const userSchema = new mongoose_1.default.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    btcPrivateKey: { type: String, required: true },
    btcPublicKey: { type: String, required: true },
    ethPrivateKey: { type: String, required: true },
    ethPublicKey: { type: String, required: true },
    iv: { type: Buffer, required: true },
    fiat: { type: Number, required: true },
    authentication: {
        _id: false,
        type: { password: String, salt: String }, required: true
    },
    isEmail2FA: { type: Boolean, required: true },
    isSMS2FA: { type: Boolean, required: true },
    isGoogle2FA: { type: Boolean, required: true },
    secret: { type: String, required: true }
});
userSchema.statics.build = (attr) => {
    return new User(attr);
};
const User = mongoose_1.default.model('Todo', userSchema);
exports.User = User;
//# sourceMappingURL=user.js.map