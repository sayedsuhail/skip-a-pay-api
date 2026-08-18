const dns = require("node:dns")
const mongoose = require("mongoose")
// const env = require("../config/env")

dns.setServers(["1.1.1.1", "8.8.8.8"])

mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("MongoDB connected successfully")
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error)
    process.exit(1)
  })
