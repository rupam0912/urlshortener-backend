const express = require('express')
const morgan = require('morgan')
const bodyParser = require('body-parser')
const cors = require('cors')
const connectDB = require('./config/db')

//importing .env
require('dotenv').config({
    path: './config/config.env'
})

const app = express()

//connect to DB
connectDB()




app.use(bodyParser.json())

//config for only development
// if(process.env.NODE_ENV === 'development') {
//     app.use(cors({
//         origin: process.env.CLIENT_URL
//     }))

//     app.use(morgan('dev'))
// }

app.use(cors())
app.use(morgan('dev'))

//Load all routes

const authRouter = require('./routes/auth.route')
const userRouter = require('./routes/user.route')

//use routes
app.use('/api/', authRouter)
app.use('/api/', userRouter)

app.use( (req,res,next)=> {
    res.status(404).json({
        success: false,
        message: "Page Not Founded"
    })
});

const PORT = process.env.PORT

app.listen(PORT, ()=> {
    console.log(`app listening on port ${PORT}`);
});

