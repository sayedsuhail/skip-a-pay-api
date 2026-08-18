const SibApiV3Sdk = require("sib-api-v3-sdk")
// const env = require("../config/env")

const sendinblueAPIKey = process.env.BREVO_API_KEY

const defaultClient = SibApiV3Sdk.ApiClient.instance

const apiKey = defaultClient.authentications["api-key"]
apiKey.apiKey = sendinblueAPIKey

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()
let sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail()

// const populateUser = async (user) => {
//   await user.populate("loan")
//   // console.log(user.loan)
//   return user.loan
// }

const getLoanDetails = (loans) => {
  let loanDetails = ""
  loans.forEach((loan) => {
    loanDetails += `
    <tr>
      <td style="border: 1px solid #000000; padding: 5px;">
        Loan: ${loan.loan_id} <br />
        Loan Description: ${loan.Description}
      </td>
    </tr>
    `
  })

  return `
  <hr />
    <table>
      ${loanDetails}
    </table>
  <hr />
  `
}

// send email when user submitted the form
const sendConfirmationEmail = async (name, email, user) => {
  // let loans = await populateUser(user)
  // console.log("loans", loans)

  const loanDetails = getLoanDetails(user.loan)
  // console.log(loanDetails)

  try {
    sendSmtpEmail = {
      to: [
        {
          email: email,
          name: name,
        },
      ],
      sender: {
        name: "SkipAPay",
        email: "support@cpdfcu-sap.com",
      },
      subject: "Confirmation of Online Form Submission!",
      htmlContent: `
      Dear <strong>${name}</strong>,
      <br />
      <pre>  Your application for Skip-A-Pay has been pre-approved.*</pre>
      <br />
      <br />
      <h3>Loan Details</h3>
        ${loanDetails}
      <br />
        Chicago Patrolmen's Federal Credit Union- Happy to Serve You. 
      <br />
      <br />
      <strong>
      *If your loan is not current or your account is not in good standing at the time Skip-A-Pay is applied, you will not be eligible for the promotion. 
      Please save this email for your records. 
      </strong>

      <div align="center">
        <img
          src="https://www.cpdfcu.com/wp-content/uploads/2023/08/2Logos.png"
          alt="Logo"
          style="max-width: 100%;"
        />
      </div>
      `,
    }
    sendEmail()
  } catch (e) {
    console.log(e)
  }
}

// send test email
const sendTestEmail = async (name = "SAP Email Server", email) => {
  try {
    sendSmtpEmail = {
      to: [
        {
          email: email,
          name: name,
        },
      ],
      sender: {
        name: "SkipAPay",
        email: "support@cpdfcu-sap.com",
      },
      subject: "Confirmation of SAP email server!",
      htmlContent: `
      Dear <strong>${name}</strong>,
      <br />
      <pre>  If you received this in your inbox, its mean sap email server is working just fine.*</pre>
      <br />
      `,
    }
    sendEmail()
  } catch (e) {
    console.log(e)
  }
}

// send email
const sendEmail = async () => {
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail)

    if (!data) {
      return new Error("Email not sent!")
    }
  } catch (e) {
    console.log(e)
  }
}

module.exports = {
  sendConfirmationEmail,
  sendTestEmail,
}
