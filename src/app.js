const express = require("express")
require("./db/mongoose")
const cors = require("cors")
const adminRouter = require("./routers/admin")
const userRouter = require("./routers/user")
const loanRouter = require("./routers/loan")

const app = express()

// pp.use(cors("*"))
app.use(cors())

app.use(express.json()) // parse the incoming requests with JSON payloads and is based upon the bodyparser
app.use(adminRouter)
app.use(userRouter)
app.use(loanRouter)

module.exports = app
