const express = require('express')
const app = express()
const userRouter = require('./src/Routes/userRoutes')
const cors = require("cors");
app.use(cors());

const port = 5000

app.use(express.json())

app.get('/', (req, res)=> {
    res.send('hello')
})
app.use('/user',userRouter);

app.use(cors({
  origin: 'http://localhost:3000'
}));


app.listen(port, ()=>{
    console.log(`hey there, listening to '${port}' `)
} )