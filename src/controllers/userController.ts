import {IUser} from '../models/user';
import {createUser, getUsers, getUserByEmail, updateUserById} from "../brokers/userBroker";
import * as crypto from "crypto";
import process from "process";

export const auth = async (email: string,password: string)=> {
    let user : IUser = await getUserByEmail(email);
    if (user == null) {
        return;
    }

    let hashedPassword = crypto.pbkdf2Sync(password + process.env.PEPPER, user.authentication.salt, 872791, 32, "sha256").toString("hex");

    if (hashedPassword != user.authentication.password) {
        return;
    }
    return user;
}

export const updateUser = async (id: string, values: Record<string, any>) => {
    await updateUserById(id, values);
}

export const insertUser = async (user: IUser) => {
    try{
        return await createUser(user) as IUser;
    } catch (error) {
        console.log(error);
        return;
    }
}