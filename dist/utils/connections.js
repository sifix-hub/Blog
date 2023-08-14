"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = void 0;
const mongoose_1 = require("mongoose");
const connectToDatabase = async () => {
    try {
        await (0, mongoose_1.connect)('mongodb+srv://db_user:' + process.env.MONGO_ATLAS_PWD + '@first-node-app.vqqlbny.mongodb.net/?retryWrites=true&w=majority&useNewUrlParser=true&useUnifiedTopology=true');
    }
    catch (err) {
        return err;
    }
};
exports.connectToDatabase = connectToDatabase;
//# sourceMappingURL=connections.js.map