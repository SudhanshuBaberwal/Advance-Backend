import express from "express"

const port = 3000;
const app = express()

app.get("/health", (req , res) => {
    return res.status(200).json({message : "All is good"})
})

app.get("/" , (req , res) => {
    return res.status(200).json({message : "Hello Sudhanshu"})
})

app.listen(port , () => {
    console.log("server running on port : " , port)
})