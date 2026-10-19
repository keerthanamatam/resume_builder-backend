const express = require('express')
const app = express()
const userRouter = require('./src/Routes/userRoutes')
const cors = require("cors");
const cookieParser = require('cookie-parser');
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

const port = 5000

app.use(express.json())
app.use(cookieParser())

app.get('/', (req, res)=> {
    res.send('hello')
})
app.use('/user',userRouter);

app.listen(port, ()=>{
    console.log(`hey there, listening to '${port}' `)
} )