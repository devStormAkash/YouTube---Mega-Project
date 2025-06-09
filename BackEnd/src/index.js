// require("dotenv").config({path : "./env"});
// import mongoose from "mongoose";
// import express from "express";
// import { DB_NAME } from "./constants.js";

import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
dotenv.config({path:"./env"})







connectDB()
    .then(() => {
        app.on("Error",(err) => {
            console.error(err)
        })
        app.listen(process.env.PORT || 3000, () => {
            console.log(`App is listening on the port ${process.env.PORT}`);     
        })
})
    .catch((err) => {
    console.error("MongoDB connection failed : ",err)
})


































/*  const app = express();
    ; (async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        app.on("error", (error) => {
            console.log(error)
            throw new error
        })
        app.listen(process.env.PORT, () => {
            console.log(`App is listening on the port ${process.env.PORT}`);
            
        })
    } catch (error) {
        console.error(error);
        throw new error
    }
})() */
