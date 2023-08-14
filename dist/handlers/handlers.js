"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const graphql_1 = require("graphql");
const schema_1 = require("../schema/schema");
const bcryptjs_1 = require("bcryptjs");
const User_1 = __importDefault(require("../models/User"));
const Blog_1 = __importDefault(require("../models/Blog"));
const Comment_1 = __importDefault(require("../models/Comment"));
;
const RootQuery = new graphql_1.GraphQLObjectType({
    name: "RootQuery",
    fields: {
        //get all users
        users: {
            type: (0, graphql_1.GraphQLList)(schema_1.UserType),
            async resolve() {
                return await User_1.default.find();
            },
        },
        user_blogs: {
            type: schema_1.UserType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            async resolve(parent, { id }) {
                return await User_1.default.findById(id).populate('blogs');
            },
        },
        blogs: {
            type: (0, graphql_1.GraphQLList)(schema_1.BlogType),
            async resolve() {
                return await Blog_1.default.find();
            },
        },
        blog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            async resolve(parent, { id }) {
                return await Blog_1.default.findById(id).populate('user comments');
            },
        },
        comments: {
            type: (0, graphql_1.GraphQLList)(schema_1.CommentType),
            async resolve() {
                return await Comment_1.default.find();
            },
        },
    }
});
const mutations = new graphql_1.GraphQLObjectType({
    name: "mutations",
    fields: {
        signup: {
            type: schema_1.UserType,
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { name, email, password }) {
                let existingUser;
                try {
                    existingUser = await User_1.default.findOne({ email });
                    if (existingUser)
                        throw new Error(`User ${name} already exists`);
                    const encryptedpassword = (0, bcryptjs_1.hashSync)(password);
                    const user = new User_1.default({ name, email, password: encryptedpassword });
                    return await user.save();
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        login: {
            type: schema_1.UserType,
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { email, password }) {
                let existingUser;
                try {
                    existingUser = await User_1.default.findOne({ email });
                    if (!existingUser)
                        throw new Error(`User ${email} does not exists`);
                    const encryptedpassword = (0, bcryptjs_1.compareSync)(password, 
                    //@ts-ignore
                    existingUser?.password);
                    return existingUser;
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        updateUser: {
            type: schema_1.UserType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                name: { type: graphql_1.GraphQLString },
                email: { type: graphql_1.GraphQLString },
            },
            async resolve(parent, { id, name, email }) {
                let user;
                try {
                    user = await User_1.default.findById(id);
                    if (!user)
                        throw new Error('User does not exist');
                    const update = {};
                    if (email)
                        update.email = email;
                    if (name)
                        update.name = name;
                    return await User_1.default.findByIdAndUpdate(id, update, { new: true });
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        addBlog: {
            type: schema_1.BlogType,
            args: {
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { title, content, date, user }) {
                let blog;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction();
                    blog = new Blog_1.default({ title, content, date, user });
                    const existingUser = await User_1.default.findById(user);
                    if (!existingUser)
                        throw new Error("User do not exist");
                    existingUser.blogs.push(blog);
                    await existingUser.save();
                    blog = await blog.save();
                    await session.commitTransaction();
                    return blog;
                }
                catch (err) {
                    await session.abortTransaction();
                    return new Error(err);
                }
                finally {
                    await session.endSession();
                }
            }
        },
        updateBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                title: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                content: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
            },
            async resolve(parent, { id, title, content }) {
                let blog;
                try {
                    blog = await Blog_1.default.findById(id);
                    if (!blog)
                        throw new Error('Blog does not exist');
                    return await Blog_1.default.findByIdAndUpdate(id, { title, content }, { new: true });
                }
                catch (err) {
                    return new Error(err);
                }
            }
        },
        deleteBlog: {
            type: schema_1.BlogType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                let blog;
                const session = await (0, mongoose_1.startSession)();
                (await session).startTransaction();
                try {
                    blog = await (await Blog_1.default.findById(id)).populate("user");
                    //@ts-ignore
                    const existingUser = blog?.user;
                    if (!blog)
                        throw new Error('Blog does not exist');
                    if (!existingUser)
                        throw new Error('User is not Linked to this blog');
                    await existingUser.blogs.pull(blog);
                    await existingUser.save();
                    await Blog_1.default.findByIdAndRemove(id);
                    await session.commitTransaction();
                }
                catch (err) {
                    return new Error(err);
                    session.abortTransaction();
                }
                finally {
                    session.endSession();
                }
            }
        },
        addComment: {
            type: schema_1.CommentType,
            args: {
                text: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                date: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                user: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                blog: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { text, blog, date, user }) {
                let comment;
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction();
                    const existingUser = await User_1.default.findById(user);
                    const existingBlog = await Blog_1.default.findById(blog);
                    if (!existingUser || !existingBlog)
                        throw new Error("User or Blog do not exist");
                    comment = new Comment_1.default({ text, blog, date, user });
                    console.log(comment);
                    existingUser.comments.push(comment);
                    existingBlog.comments.push(comment);
                    await existingUser.save();
                    await existingBlog.save();
                    comment = await comment.save();
                    await session.commitTransaction();
                    return comment;
                }
                catch (err) {
                    await session.abortTransaction();
                    return new Error(err);
                }
                finally {
                    await session.endSession();
                }
            }
        },
        deleteComment: {
            type: schema_1.CommentType,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
            },
            async resolve(parent, { id }) {
                const session = await (0, mongoose_1.startSession)();
                try {
                    session.startTransaction();
                    let comment = await Comment_1.default.findById(id);
                    if (!comment)
                        throw new Error("Comment do not exist");
                    //@ts-ignore
                    const existingBlog = await (await Blog_1.default.findById(comment?.blog));
                    //@ts-ignore
                    const existingUser = await (await User_1.default.findById(comment?.user));
                    await existingUser.comments.pull(comment);
                    await existingUser.save();
                    await existingBlog.comments.pull(comment);
                    existingBlog.save();
                    await Comment_1.default.findByIdAndRemove(id);
                    await session.commitTransaction();
                    return comment;
                }
                catch (err) {
                    await session.abortTransaction();
                    return new Error(err);
                }
                finally {
                    await session.endSession();
                }
            }
        },
    }
});
exports.default = new graphql_1.GraphQLSchema({ query: RootQuery, mutation: mutations });
//# sourceMappingURL=handlers.js.map