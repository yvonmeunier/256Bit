"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserById = exports.deleteUserById = exports.createUser = exports.getUserById = exports.getUserByEmail = exports.getUsers = void 0;
const user_1 = require("../models/user");
const getUsers = () => user_1.User.find();
exports.getUsers = getUsers;
const getUserByEmail = (email) => user_1.User.findOne({ email });
exports.getUserByEmail = getUserByEmail;
const getUserById = (id) => user_1.User.findById(id);
exports.getUserById = getUserById;
const createUser = (user) => user_1.User.build(user)
    .save().then((user) => user.toObject());
exports.createUser = createUser;
const deleteUserById = (id) => user_1.User.findOneAndDelete({ _id: id });
exports.deleteUserById = deleteUserById;
const updateUserById = (id, values) => user_1.User.findByIdAndUpdate(id, values);
exports.updateUserById = updateUserById;
//# sourceMappingURL=userBroker.js.map