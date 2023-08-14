import express from 'express';
import { config } from 'dotenv';
import {connectToDatabase}  from './utils/connections';
import { graphqlHTTP } from 'express-graphql';
import schema from './handlers/handlers';
import cors from 'cors';


// to configure dotenv
config();

const app = express();

app.use(cors());

const port = process.env.PORT;



app.use('/graphql', graphqlHTTP({schema, graphiql:false}));
connectToDatabase().
then(() => {
    app.listen(port, ()=>console.log(`Server open on Port ${port}`));
})
.catch((err) => console.log(err));
