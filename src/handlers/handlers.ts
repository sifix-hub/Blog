import {Document,  startSession} from 'mongoose';
import { GraphQLList, GraphQLNonNull, GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLID } from "graphql";
import { UserType, BlogType, CommentType } from "../schema/schema";
import {hashSync, compareSync } from "bcryptjs";
import User from "../models/User";
import Blog from "../models/Blog";
import Comment from "../models/Comment";

interface CommentDocument extends Document {
    blog: any; // Replace 'any' with the actual type of 'blog' property
    user: any; // Replace 'any' with the actual type of 'user' property
    // Other properties of the Comment document
  };

 const RootQuery = new GraphQLObjectType({
    name: "RootQuery",
    fields:{
        //get all users
        users:{
            type:GraphQLList(UserType),
            async resolve(){
            return await User.find();  
            },
        },
        user_blogs:{
            type:UserType,
            args: {
                id:{type:GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent, {id}){
                
            return await User.findById(id).populate('blogs');  
            },
        },
        blogs:{
            type:GraphQLList(BlogType),
            async resolve(){
            return await Blog.find();  
            },
        },

        blog:{
            type:BlogType,
            args: {
                id:{type:GraphQLNonNull(GraphQLID)}
            },
            async resolve(parent, {id}){
                
            return await Blog.findById(id).populate('user comments');  
            },
        },

        comments:{
            type:GraphQLList(CommentType),
            async resolve(){
            return await Comment.find();  
            },
        },

    }
});

const mutations = new GraphQLObjectType({
    name:"mutations",
    fields:{
        
        signup:{
            type: UserType,
            args: {
                name:{type: GraphQLNonNull(GraphQLString)},
                email:{type: GraphQLNonNull(GraphQLString)},
                password:{type: GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, {name, email, password} ){
                let existingUser:Document<any, any, any>;
                try{
                    existingUser = await User.findOne({email});
                    if(existingUser) throw new Error(`User ${name} already exists`);
                    const encryptedpassword = hashSync(password);
                    const user = new User({name, email, password:encryptedpassword});
                    return await user.save();
                    
                    
                }catch (err){
                        return new Error(err);
                }
                
            }
        },

        login:{
            type: UserType,
            args: {
                email:{type: GraphQLNonNull(GraphQLString)},
                password:{type: GraphQLNonNull(GraphQLString)},
            },
            async resolve(parent, {email, password} ){
                let existingUser:Document<any, any, any>;
                try{
                    
                    existingUser = await User.findOne({email});
                    if(!existingUser) throw new Error(`User ${email} does not exists`);
                    const encryptedpassword = compareSync(
                        password, 
                        //@ts-ignore
                        existingUser?.password);
                    return existingUser;  
                    
                }catch (err){
                        return new Error(err);
                }
                
            }
        },
        updateUser:{
            type: UserType,
            args: {
                id:{type: GraphQLNonNull(GraphQLID)},
                name:{type: GraphQLString},
                email:{type: GraphQLString},
               
               
            },
            async resolve(parent, {id, name, email} ){
                let user:Document<any, any, any>;
                
                try{
                    user =  await User.findById(id);
                    if(!user) throw new Error('User does not exist');
                    const update: { email?: string, name?: string } = {};
                    if(email) update.email = email;
                    if(name) update.name = name;
                    return await User.findByIdAndUpdate(id,update, {new:true});    
                }catch (err){
                        return new Error(err);
                }
                
            }
        },

        addBlog:{
            type: BlogType,
            args: {
                title:{type: GraphQLNonNull(GraphQLString)},
                content:{type: GraphQLNonNull(GraphQLString)},
                date:{type: GraphQLNonNull(GraphQLString)},
                user:{type: GraphQLNonNull(GraphQLID)},
            },
            async resolve(parent, {title, content, date, user} ){
                let blog:Document<any, any, any>;
                const session = await startSession();
                try{
                    session.startTransaction();
                    blog = new Blog({title, content, date, user});
                    const existingUser = await User.findById(user);
                    if(!existingUser) throw new Error("User do not exist");
                    existingUser.blogs.push(blog);
                    await existingUser.save();
                    
                    
                    blog = await blog.save();
                    
                    await session.commitTransaction();
                    return blog;
                }catch (err){
                        await session.abortTransaction();
                        return new Error(err);
                }finally{
                    await session.endSession();
                }
                
            }
        },
        updateBlog:{
            type: BlogType,
            args: {
                id:{type: GraphQLNonNull(GraphQLID)},
                title:{type: GraphQLNonNull(GraphQLString)},
                content:{type: GraphQLNonNull(GraphQLString)},
               
               
            },
            async resolve(parent, {id, title, content} ){
                let blog:Document<any, any, any>;
                
                try{
                    blog =  await Blog.findById(id);
                    if(!blog) throw new Error('Blog does not exist');
                    return await Blog.findByIdAndUpdate(id,{title, content}, {new:true});    
                }catch (err){
                        return new Error(err);
                }
                
            }
        },

        deleteBlog:{
            type: BlogType,
            args: {
                id:{type: GraphQLNonNull(GraphQLID)},
               
            },
            async resolve(parent, {id} ){
                let blog:DocumentType;
                const session = await startSession();
                (await session).startTransaction();
                try{
                    blog =  await (await Blog.findById(id)).populate("user");
                    //@ts-ignore
                    const existingUser = blog?.user;
                    if(!blog) throw new Error('Blog does not exist');
                    if(!existingUser) throw new Error('User is not Linked to this blog');
                    await existingUser.blogs.pull(blog);
                    await existingUser.save();
                     await Blog.findByIdAndRemove(id); 
                     await session.commitTransaction();   
                }catch (err){
                        return new Error(err);
                        session.abortTransaction();
                }finally{
                    session.endSession();
                }
                
            }
        },
        addComment:{
            type: CommentType,
            args: {
                
                text:{type: GraphQLNonNull(GraphQLString)},
                date:{type: GraphQLNonNull(GraphQLString)},
                user:{type: GraphQLNonNull(GraphQLID)},
                blog:{type: GraphQLNonNull(GraphQLID)},
            },

            async resolve(parent, {text, blog, date, user} ){
                let comment:Document;
                const session = await startSession();
                try{
                    session.startTransaction();
                    
                    const existingUser = await User.findById(user);
                    const existingBlog = await Blog.findById(blog);
                    if(!existingUser || !existingBlog) throw new Error("User or Blog do not exist");
                    comment = new Comment({text, blog, date, user});
                    console.log(comment);
                    existingUser.comments.push(comment);
                    existingBlog.comments.push(comment);
                    await existingUser.save();
                    await existingBlog.save();
                    comment = await comment.save();
                    
                    await session.commitTransaction();
                    return comment;
                }catch (err){
                        await session.abortTransaction();
                        return new Error(err);
                }finally{
                    await session.endSession();
                }
                
            }
        },
        deleteComment:{
            type: CommentType,
            args: {
                
               
                id:{type: GraphQLNonNull(GraphQLID)},
               
            },
            async resolve(parent, {id} ){
                
                const session = await startSession();
                try{
                    session.startTransaction();
                    
                    
                    
                     let comment : DocumentType = await Comment.findById(id);
                     if(!comment) throw new Error("Comment do not exist");
                    //@ts-ignore
                    const existingBlog = await  ( await Blog.findById(comment?.blog));
                    //@ts-ignore
                    const existingUser = await (await User.findById(comment?.user)); 
                    await existingUser.comments.pull(comment);
                    await existingUser.save();
                    await existingBlog.comments.pull(comment)
                    existingBlog.save();
                    await Comment.findByIdAndRemove(id);
                    
                    await session.commitTransaction();
                    return comment;
                }catch (err){
                        await session.abortTransaction();
                        return new Error(err);
                }finally{
                    await session.endSession();
                }
                
            }
        },
    }
});

export default new GraphQLSchema({query:RootQuery, mutation:mutations});