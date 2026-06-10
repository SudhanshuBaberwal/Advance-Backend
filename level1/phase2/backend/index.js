import express from "express";
import dotenv from "dotenv";
const app = express()

dotenv.config()

app.use("/" , (req , res) => {
    return res.status(201).json({message : "Hello from docker phase 2"})
})

const port = process.env.PORT || 5000   
app.listen(port , () => {
    console.log("Server running on port : " , port)
})