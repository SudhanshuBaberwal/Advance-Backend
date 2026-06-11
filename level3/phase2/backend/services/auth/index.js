import express from "express"
import dotenv, { config } from "dotenv"

const app = express()

dotenv.config()

const port = process.env.PORT || 5000

app.use(express.json())

app.get("/" , (req , res) => {
    return res.status(200).json({message : "Hello from auth services"})
})

app.listen(port , () => {
    console.log("server started on port : " , port)
})