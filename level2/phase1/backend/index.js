import express from "express"
import dotenv from 'dotenv'
import connectDB from "./lib/db.js  ";
import User from "./model/user.mode.js";
import Redis from "ioredis";
import ratelimitter from "./middleware/ratelimit.js";
import sendEmail from "./lib/sendEmail.js";
import emailQueue from "./queue.js";
// import connectDB from "./lib/db.js`";
dotenv.config()
const app = express()
app.use(express.json())
const port = process.env.PORT || 5000;

export const redis = new Redis(process.env.REDIS_URL)

app.get("/" , (req , res) => {
    return res.status(200).json({message : "Hello from redis"})
})

app.post("/create" , async (req , res) => {
    try {
        const {name , email , password} = req.body;
        await redis.del("user:all")
        const user = await User.create({
            name,email,password
        })
        await emailQueue.add("send-email",{email})
        return res.json(user)
    } catch (error) {
        console.log("error in create user api")
    }
})

app.get("/get", ratelimitter , async (req , res) => {
    try {
       const user = await User.find({})
       return res.json(user)
    } catch (error) {
        console.log("error in create user api")
    }
})

app.get("/redis-get", async (req, res) => {
    const cached = await redis.get("user:all");

    if (cached) {
        const user = JSON.parse(cached)
        return res.json(user);
    }

    const users = await User.find({});

    await redis.set("user:all", JSON.stringify(users));

    return res.json(users);
});

app.post("/send-otp", async (req , res) => {
    const {email} = req.body;
    const otp = Math.floor(100000+ Math.random() *900000).toString()
    await redis.set(`otp:${email}`,otp,"EX",30)
    return res.json({otp})
})

app.post("/verify-otp", async (req , res) => {
    const {email,otp} = req.body;
    const cachedOtp = await redis.get(`otp:${email}`)
    if (!cachedOtp){
        return res.json({message : "otp not found or expired"})
    }

    if (cachedOtp != otp){
        return res.status(400).json({message : "Incorrect otp"})
    }
    
    return res.json({message : "OTP verified"})
})


connectDB()

app.listen(port , () => {
    
    console.log(`server started ${port}`)
})



// without redis --- 171MS
// with redis --- 2 MS



// 319382