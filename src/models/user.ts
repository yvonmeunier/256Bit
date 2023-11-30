import mongoose from 'mongoose';
// its the table
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    btcPrivateKey: { type: String, required: true },
    btcPublicKey: { type: String, required: true },
    ethPrivateKey: { type: String, required: true },
    ethPublicKey: { type: String, required: true },
    iv: {type: Buffer, required: true},
    fiat: {type: Number, required: true},
    authentication : {
        _id: false,
        type: {password : String, salt: String}, required: true
    },
    isEmail2FA: {type: Boolean, required: true},
    isSMS2FA: {type: Boolean, required: true},
    isGoogle2FA: {type: Boolean, required: true},
    secret: {type:  String, required: true}
});

// interface we use so typescript can throw errors when we pass as a param a User
export interface IUser {
    username: string,
    email: string,
    btcPrivateKey: string,
    btcPublicKey: string,
    ethPrivateKey: string,
    ethPublicKey: string,
    iv: Buffer,
    fiat: number,
    authentication : {
        password: string,
        salt: string
    },
    isEmail2FA: boolean,
    isSMS2FA: boolean,
    isGoogle2FA: boolean,
    secret: string
}

// allows us to have a build function under the User class instead of directly calling build(attr)
interface userModelInterface extends mongoose.Model<UserDoc> {
    build(attr: IUser): UserDoc;
}

export interface UserDoc extends mongoose.Document {
    _id: number
    username: string,
    email: string,
    btcPrivateKey: string,
    btcPublicKey: string,
    ethPrivateKey: string,
    ethPublicKey: string,
    iv: Buffer,
    fiat: number,
    authentication : {
        password: string,
        salt: string
    },
    isEmail2FA: boolean,
    isSMS2FA: boolean,
    isGoogle2FA: boolean,
    secret: string
}
userSchema.statics.build = (attr: IUser) => {
    return new User(attr);
}

const User = mongoose.model<UserDoc, userModelInterface>('Todo', userSchema)

export { User }



