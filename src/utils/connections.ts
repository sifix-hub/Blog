import { connect } from "mongoose";




export const connectToDatabase = async ()=>{
    try{
        await connect(
            'mongodb+srv://db_user:' + process.env.MONGO_ATLAS_PWD + '@first-node-app.vqqlbny.mongodb.net/?retryWrites=true&w=majority&useNewUrlParser=true&useUnifiedTopology=true'
          );
    }catch(err){
        return err;
    }
   
}