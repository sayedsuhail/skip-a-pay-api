const mongoose = require("mongoose")
const validator = require("validator")
const Loan = require("./loan")
const csv = require("csv-writer").createObjectCsvStringifier
const moment = require("moment")

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    middleName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    ssnNumber: {
      // last 4 digits of ssn
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid!")
        }
      },
    },
    website: {
      type: String,
      trim: true,
    },
    loan: [
      {
        loan_type: {
          type: String,
          required: true,
          trim: true,
        },
        loan_id: {
          type: String,
          required: true,
          trim: true,
        },
        Description: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

userSchema.statics.filterByDays = (days) => {
  if (!days) {
    return {}
  }
  // Get the current date
  const currentDate = new Date()

  // Calculate the date n days ago
  const nDaysAgo = new Date()
  nDaysAgo.setDate(currentDate.getDate() - days)

  // Construct the query for the last n days
  let query = { createdAt: { $gte: nDaysAgo, $lte: currentDate } }

  return query
}

// get loan details for user
userSchema.statics.getLoanDetails = async (currentUser) => {
  let availableLoans = []

  const loans = await Loan.find({
    account_number: currentUser.accountNumber,
    last_ssn_digits: currentUser.ssnNumber,
  })

  let user = await User.findOne({
    accountNumber: currentUser.accountNumber,
    ssnNumber: currentUser.ssnNumber,
  })

  // loan and user both not available
  if ((!loans || !loans.length) && !user) {
    throw new Error("Loan not available, please try again later.")
  }

  // populate and return
  if (user) {
    availableLoans = removeItemsBasedOnId(loans, user.loan)

    return {
      user,
      availableLoans,
    }
  }

  return {
    user: "Please Apply for loan!",
    availableLoans: loans,
  }
}

// remove common element based on loan_id and retrun new arr
function removeItemsBasedOnId(arr1, arr2) {
  return arr1.filter(
    (item1) => !arr2.some((item2) => item1.loan_id === item2.loan_id),
  )
}

// make csv file and return
// loan will be in separate lines in csv
userSchema.statics.makeCsv = async (days) => {
  let query = User.filterByDays(days)

  const users = await User.find(query)

  if (!users) {
    throw new Error("Users not found.")
  }

  // format data for CSV downloadable file
  // flatMap so each loan produces its own row (repeating the user's other fields)
  const csvJsonData = users.flatMap(
    ({
      _id,
      firstName,
      middleName,
      lastName,
      accountNumber,
      loan,
      email,
      createdAt,
    }) => {
      const baseRow = {
        ID: _id,
        Name: `${firstName} ${middleName ? middleName + " " : ""}${lastName}`,
        Email: email,
        "Account Number": accountNumber,
        "Submitted Date": moment(createdAt).format("MMMM Do, YYYY, h:mm a"),
      }

      // if user has no loans, still return one row with blank Loan ID
      if (!loan || loan.length === 0) {
        return [{ ...baseRow, "Loan ID": "" }]
      }

      // one row per loan
      return loan.map((l) => ({
        ...baseRow,
        "Loan ID": l?.loan_id ?? "",
      }))
    },
  )

  // set headers for CSV
  const csvStringifier = csv({
    header: [
      { id: "ID", title: "ID" },
      { id: "Name", title: "Name" },
      { id: "Email", title: "Email" },
      { id: "Account Number", title: "Account Number" },
      { id: "Loan ID", title: "Loan ID" },
      { id: "Submitted Date", title: "Submitted Date" },
    ],
  })

  const csvData =
    csvStringifier.getHeaderString() +
    csvStringifier.stringifyRecords(csvJsonData)

  return csvData
}

// make csv file and return
// loan will be in same line eg Loan ID: 1, 3, 4
// userSchema.statics.makeCsv = async (days) => {
//   let query = User.filterByDays(days)

//   const users = await User.find(query)
//   // .populate("loan") // no need to populate loan

//   if (!users) {
//     throw new Error("Users not found.")
//   }

//   // format data for CSV downloadable file
//   const csvJsonData = users.map(
//     ({
//       _id,
//       firstName,
//       middleName,
//       lastName,
//       accountNumber,
//       loan,
//       email,
//       createdAt,
//     }) => ({
//       ID: _id,
//       Name: `${firstName} ${middleName ? middleName + " " : ""}${lastName}`,
//       Email: email,
//       "Account Number": accountNumber,
//       // "Loan ID": loan.loan_id,
//       "Loan ID": extractLoans(loan),
//       // "Last SSN Digits": loan.last_ssn_digits,
//       "Submitted Date": moment(createdAt).format("MMMM Do, YYYY, h:mm a"),
//     }),
//   )

//   // get all loans of a user
//   function extractLoans(loans) {
//     let allLoans = ""
//     for (let i = 0; i < loans.length; i++) {
//       if (i == 0) {
//         allLoans = loans[i]?.loan_id
//       } else {
//         allLoans = `${allLoans}, ${loans[i]?.loan_id}`
//       }
//     }
//     // loans.forEach((loan) => {
//     //   allLoans = `${allLoans}, ${loan.loan_id}`
//     // })

//     return allLoans
//   }

//   // set headers for CSV
//   const csvStringifier = csv({
//     header: [
//       { id: "ID", title: "ID" },
//       { id: "Name", title: "Name" },
//       { id: "Email", title: "Email" },
//       { id: "Account Number", title: "Account Number" },
//       { id: "Loan ID", title: "Loan ID" },
//       // { id: "Last SSN Digits", title: "Last SSN Digits" },
//       { id: "Submitted Date", title: "Submitted Date" },
//       // Add more headers as needed
//     ],
//   })

//   const csvData =
//     csvStringifier.getHeaderString() +
//     csvStringifier.stringifyRecords(csvJsonData)

//   return csvData
// }

const User = mongoose.model("User", userSchema)

module.exports = User
