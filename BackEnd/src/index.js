// require("dotenv").config({path : "./env"});
import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv"
dotenv.config({path:"./env"})







connectDB();


































/* const app = express()
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
