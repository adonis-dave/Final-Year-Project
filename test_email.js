require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail password or app password
  },
});

transporter.sendMail(
  {
    from: process.env.EMAIL_USER,
    to: "emilydean656@gmail.com",
    subject: "Test Email",
    text: "This is a test email from Nodemailer.",
  },
  (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  }
);
