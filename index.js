const express = require("express");
const { Pool } = require("pg");
const app = express();
const sendSMS = require("./SMS.js");
const { sendLoanReport } = require("./loanReport");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require("dotenv").config();

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mi vida",
  port: 5432,
});

const ussdCode = "*384*71188#";
let guarantor_name;

// Sample NIDA owner lookup function
const getNidaOwner = async (nida_number) => {
  try {
    // Check if the NIDA number exists in the users table
    let result = await pool.query(
      "SELECT name FROM users WHERE nida_number = $1",
      [nida_number]
    );
    if (result.rows.length) {
      return { name: result.rows[0].name, type: "applicant" };
    }

    // Check if the NIDA number exists in the guarantor_approvals table
    result = await pool.query(
      "SELECT guarantor_name AS name FROM guarantor_approvals WHERE guarantor_nida = $1",
      [nida_number]
    );
    if (result.rows.length) {
      return { name: result.rows[0].name, type: "guarantor" };
    }

    return null; // NIDA number not found
  } catch (error) {
    console.error("Database error (getNidaOwner):", error);
    return null;
  }
};

//get NIDA user phone number
const getUserPhoneNumber = async (nida_number) => {
  try {
    const result = await pool.query(
      "SELECT phone_number FROM users WHERE nida_number = $1",
      [nida_number]
    );
    return result.rows.length ? result.rows[0].phone_number : null;
  } catch (error) {
    console.error("Database error (getUserPhoneNumber):", error);
    return null;
  }
};
//eligibility check function
const checkLoanEligibility = async (nida_number) => {
  try {
    //check if the applicant has already applied for university or not
    const eduResult = await pool.query(
      "SELECT university_applied FROM education_table WHERE nida_number = $1",
      [nida_number]
    );

    //check if user has existing debt
    const debtResult = await pool.query(
      "SELECT total_debt FROM debts WHERE nida_number = $1",
      [nida_number]
    );

    const hasAppliedForUniversity = eduResult.rows.length
      ? eduResult.rows[0].university_applied
      : false;
    const totalDebt = debtResult.rows.length
      ? debtResult.rows[0].total_debt
      : 0;

    return { hasAppliedForUniversity, totalDebt };
  } catch (error) {
    console.error("Database error (checkLoanEligibility):", error);
    return null;
  }
};

// Sample loan application status check (replace with actual implementation)
const checkLoanApplicationStatus = async (nida_number) => {
  try {
    const result = await pool.query(
      "SELECT status FROM loans WHERE nida_number = $1",
      [nida_number]
    );
    return result.rows.length ? result.rows[0].status : "not_found";
  } catch (error) {
    console.error("Database error (checkLoanApplicationStatus):", error);
    return "Error fetching loan status";
  }
};

// Sample debt lookup function (replace with actual implementation)
const getDebtAmount = async (nida_number) => {
  try {
    const result = await pool.query(
      "SELECT total_debt FROM debts WHERE nida_number = $1",
      [nida_number]
    );
    return result.rows.length ? result.rows[0].total_debt : null;
  } catch (error) {
    console.error("Database error (getDebtAmount):", error);
    return "Error fetching debt amount";
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

const sendGuarantorOTP = async (nida_number) => {
  try {
    // Fetch the guarantor's details based on the applicant's NIDA number
    const guarantorResult = await pool.query(
      `SELECT g.guarantor_name, g.guarantor_phone 
       FROM guarantor_approvals g
       INNER JOIN users u ON g.nida_number = u.nida_number
       WHERE u.nida_number = $1`,
      [nida_number]
    );

    if (!guarantorResult.rows.length) {
      console.error("Guarantor not found for the given applicant.");
      return "Guarantor not found.";
    }

    const guarantor_name = guarantorResult.rows[0].guarantor_name;
    const guarantor_phone = guarantorResult.rows[0].guarantor_phone;
    const otp = generateOTP();

    // Store OTP in the guarantor approvals table
    await pool.query(
      `UPDATE guarantor_approvals 
       SET otp_code = $1, confirmed = FALSE 
       WHERE nida_number = $2`,
      [otp, nida_number]
    );

    // Send SMS with OTP to the guarantor
    await sendSMS(
      guarantor_phone,
      `Dear ${guarantor_name}, Please confirm the loan request for your Loan Applicant using this OTP: ${otp}.\n\nDial this USSD code ${ussdCode} and select option 4: "Confirm Sponsorship" to approve the loan application.\n\nDO NOT SHOW THIS CODE TO ANYONE.`
    );

    console.log(`OTP sent to guarantor ${guarantor_name} at ${guarantor_phone}`);
  } catch (error) {
    console.error("Error in sendGuarantorOTP:", error);
    throw error;
  }
};

//Validation function for NIDA numbers
const validateNidaNumber = (nida_number) => {
  if (!/^\d{20}$/.test(nida_number)) {
    return false; // Invalid NIDA number
  }
  return true; // Valid NIDA number
};

app.get("/api/test", (req, res) => {
  res.send("Testing Server");
});

//USSD logic
// Handle USSD requests
app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const userInputs = text.split("*");
  const nida_number = userInputs[0]; // Keep the first entry as the NIDA number
  const selection = userInputs.length > 1 ? userInputs.slice(1).join("*") : ""; // Handle menu inputs correctly
  const nida_owner = await getNidaOwner(nida_number);
  const { hasAppliedForUniversity, totalDebt } = await checkLoanEligibility(
    nida_number
  );
  const loan_status = await checkLoanApplicationStatus(nida_number);
  const userPhoneNumber = await getUserPhoneNumber(nida_number);
  const recipientEmail = "emilydean656@gmail.com"; // Replace with the actual email

  let response = "";

  if (text === "") {
    response = `CON Welcome to HESLB Mobile OLAMS USSD Service.
        Please enter your NIDA number to proceed.`;
  } else if (!validateNidaNumber(nida_number)) {
    response = `END Invalid NIDA number. 
    Please enter a valid 20-digit NIDA number.`;
  } else if (!nida_owner) {
    response = `END NIDA number "${nida_number}" has not been found in our database.
      Please verify your details or contact NIDA support.`;
  } else if (text === nida_number) {
    response = `CON Hello "${nida_owner.name}", do you confirm that "${nida_number}" is your NIDA Number?
      1. Yes
      2. No`;
  } else if (selection === "1") {
    if (nida_owner.type === "applicant") {
      // Apply eligibility checks only for applicants
      if (totalDebt > 0) {
        response = `END You are not eligible for loan application as you have an outstanding debt.
        Please clear your debt of ${totalDebt} Tsh first before applying for a new loan.`;
      } else if (!hasAppliedForUniversity) {
        response = `END You are not eligible for loan application as you have not applied to any university yet.
        Please apply for a university first before applying for a loan.`;
      }
    }

    response = `CON Welcome ${nida_owner.name}, you proceed?
      1. Apply for Loan
      2. Request Loan Application Status
      3. Request Debt amount
      4. Confirm Sponsorship`;
  } else if (selection === "2") {
    // User does not confirm their NIDA number
    response = `END Please re-enter your NIDA number for verification.`;
  } else if (selection === "1*1") {
    response = `CON Yes
        An amount of 40,000 Tsh will be required to access this service. Are you ready to pay?
        1. Yes, proceed
        2. Cancel`;
  } else if (selection === "1*1*1") {
    response = `CON Enter your PIN to confirm payment of 40,000 Tsh to HESLB-Mobile OLAMS`;
  } else if (selection.startsWith("1*1*1*")) {
    const enteredPin = selection.split("*")[3];
    const validPin = "1234";

    if (enteredPin === validPin) {
      response = `END Payment Successful and Application Submitted!
        Your registered guarantor has been notified and will need to confirm your loan sponsorship.`;

      // Fetch the applicant's phone number from the database

      // Send SMS to the applicant
      sendSMS(
        userPhoneNumber,
        `Your Loan Application is now PENDING.\nYour registered guarantor has been sent an OTP for confirmation. Notify them to check their SMS to approve their sponsorship for your Loan Application.`
      );

      // Send OTP to the guarantor
      await sendGuarantorOTP(nida_number);
    } else {
      response = `END Invalid PIN. Please try again.`;
    }
  } else if (selection === "1*1*2") {
    response = `END Cancel
        Thank you for using for our service. Hope to see you again.`;
  } else if (selection === "1*2") {
    if (loan_status === "received") {
      response = `END Your submission for Loan Application has been received successfully.
      Good luck with your application.`;
      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner.name}, your loan application has been received successfully. Good luck with your application.`
        );
      }
    } else if (loan_status === "pending") {
      response = `END Your loan application is still under review.
      A SMS notification will be sent to you once your application has been reviewed.`;
      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner.name}, your loan application is still under review. A SMS notification will be sent to you once your application has been reviewed.`
        );
      }
    } else {
      response = `END No loan application has been received for your NIDA number ${nida_number}.
      Submit loan applications for Status verification`;

      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner.name}, no loan application has been received for your NIDA number ${nida_number}. Submit loan applications for Status verification`
        );
      }
    }
  } else if (selection === "1*3") {
    const total_debt = await getDebtAmount(nida_number); // Use correct NIDA number
    response =
      total_debt === null
        ? `END Dear ${nida_owner.name}, you currently have no outstanding debt. Thank you for staying up to date with your payments.`
        : `END Your total debt is ${total_debt} Tsh. Please pay any debts owed in due time to assist other students.`;

    if (userPhoneNumber) {
      if (total_debt === null) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner.name}, you currently have no outstanding debt. Thank you for staying up to date with your payments.`
        );
      } else {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner.name}, your total outstanding debt is ${total_debt} Tsh. Please make payments promptly to assist other students.`
        );
      }
    }
  } else if (selection === "1*4") {
    // Guarantor enters OTP
    response = `CON Dear Guarantor,
    Please enter the OTP sent to your registered phone number.`;
  } else if (selection.startsWith("1*4*")) {
    const enteredOTP = selection.split("*")[2];
    const guarantor_nida = nida_number; // Guarantor logs in using their NIDA number

    // Fetch OTP details from the database using guarantor_nida
    const otpResult = await pool.query(
      "SELECT otp_code, nida_number FROM guarantor_approvals WHERE guarantor_nida = $1",
      [guarantor_nida]
    );

    if (!otpResult.rows.length) {
      response = `END No OTP found for the provided NIDA number. Please try again.`;
    } else if (otpResult.rows[0].otp_code !== enteredOTP) {
      response = `END Invalid OTP. Please check your SMS inbox and enter the correct code.`;
    } else {
      const applicant_nida = otpResult.rows[0].nida_number;

      // Update guarantor approval status
      await pool.query(
        "UPDATE guarantor_approvals SET confirmed = TRUE WHERE guarantor_nida = $1",
        [guarantor_nida]
      );

      // Update loan status to 'received'
      await pool.query(
        "UPDATE loans SET status = 'received' WHERE nida_number = $1",
        [applicant_nida]
      );

      // Fetch loan ID for reporting
      const loanResult = await pool.query(
        "SELECT id FROM loans WHERE nida_number = $1",
        [applicant_nida]
      );
      const loan_id = loanResult.rows.length ? loanResult.rows[0].id : null;

      // Update loan report
      await pool.query(
        `UPDATE loan_reports 
       SET guarantor_approved = TRUE, 
           application_date = CURRENT_DATE,
           loan_id = $2
       WHERE nida_number = $1`,
        [applicant_nida, loan_id]
      );

      response = `END Loan application for Applicant with NIDA Number ${applicant_nida} has been approved by the registered Guarantor. The loan application status is now RECEIVED.`;

      // Notify the applicant
      const applicantPhoneNumber = await getUserPhoneNumber(applicant_nida);
      if (applicantPhoneNumber) {
        sendSMS(
          applicantPhoneNumber,
          `Your loan application has been confirmed by your registered guarantor. Goodluck with your application.`
        );
      }

      // Send email notification
      await sendLoanReport(applicant_nida, recipientEmail);
    }
  }
  else {
    response = `END Invalid input. Please try again.`;
  }

  res.set("Content-Type: text/plain");
  res.send(response);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`USSD Server running on http://localhost:${PORT}`);
});
