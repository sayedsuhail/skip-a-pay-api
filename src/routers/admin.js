const express = require("express")
const Admin = require("../models/admin")
const auth = require("../middleware/auth")
const router = new express.Router()
const bcrypt = require("bcryptjs")
const { sendTestEmail } = require("../emails/account")

// root for testing app
router.get("/", async (req, res) => {
  res.send("App is running...")
})

// send test email
router.post("/testemail", async (req, res) => {
  try {
    // send test email
    sendTestEmail(req.body.name, req.body.email)

    res.send({
      status: `Email sent to ${req.body.email}, please check your inbox`,
    })
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

// create admin
// router.post("/admins", async (req, res) => {
//   const admin = new Admin(req.body)

//   try {
//     await admin.save()

//     const token = await admin.generateAuthToken()

//     res.status(201).send({ admin, token })
//   } catch (e) {
//     res.status(400).send(e)
//   }
// })

// login admin
router.post("/admins/login", async (req, res) => {
  try {
    // make our own method for login
    const admin = await Admin.findByCredentials(
      req.body.email,
      req.body.password
    )

    const token = await admin.generateAuthToken()

    res.send({ admin, token })
  } catch (e) {
    res.status(400).send({ error: e.message })
  }
})

// logout admin
router.post("/admins/logout", auth, async (req, res) => {
  try {
    req.admin.tokens = req.admin.tokens.filter(
      (token) => token.token !== req.token
    )

    await req.admin.save()

    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// logout admin from all devices
router.post("/admins/logoutAll", auth, async (req, res) => {
  try {
    req.admin.tokens = []

    await req.admin.save()

    res.send()
  } catch (e) {
    res.status(500).send()
  }
})

// reset password
router.post("/admins/changepassword", auth, async (req, res) => {
  try {
    const { password, oldPassword } = req.body
    if (!password || password.length < 7) {
      throw new Error("Password must be greater than 6 characters.")
    }
    // console.log('data', req.admin)
    const isMatch = await bcrypt.compare(oldPassword, req.admin.password)
    if (isMatch) {
      req.admin.password = password
      req.admin.save()
      return res.status(201).send(req.admin)
    }
    return res
      .status(400)
      .send({ error: `Your password doesn't match to the old one` })
  } catch (err) {
    return res.status(400).send({ error: err.message })
  }
})

// get current admin
router.get("/admins/me", auth, async (req, res) => {
  res.send(req.admin)
})

// update the admin
router.patch("/admins/me", auth, async (req, res) => {
  const updates = Object.keys(req.body)
  const allowedUpdates = ["name", "email", "password"]
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  )

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" })
  }

  try {
    // update each property dynamically
    updates.forEach((update) => (req.admin[update] = req.body[update]))
    await req.admin.save()
    res.send(req.admin)
  } catch (e) {
    res.status(400).send(e)
  }
})

// delete the admin
router.delete("/admins/me", auth, async (req, res) => {
  try {
    await req.admin.deleteOne()
    res.status(202).send()
  } catch (e) {
    res.status(500).send(e)
  }
})

module.exports = router
