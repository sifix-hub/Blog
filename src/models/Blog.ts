import {Schema, model} from 'mongoose';


const blogSchema:Schema = new Schema ({
    title:{
        type:String,
        required:true,
    },

    content:{
        type:String,
        required:true,
    },

    date:{
        type:Date,
        required:true,
    },
    comments:[{type:Schema.Types.ObjectId, ref: "Comment"}],
    user:{type:Schema.Types.ObjectId, ref: "User"},

});

export default model("Blog", blogSchema);