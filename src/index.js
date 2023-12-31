// require('dotenv').config({path:'./env'})

import mongoose from "mongoose";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({
    path:'./.env'
})

connectDB()


/*
const app = express();

(async ()=>{
    try{
        mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("ERROR:",error);
            throw err;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`)
        })
    }catch(err){
        console.error("ERROR: ",err);
        throw err;
    }
})
*/