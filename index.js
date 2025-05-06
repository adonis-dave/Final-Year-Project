const express = require("express");
const { Pool } = require("pg");
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mi vida",
  port: 5432,
});

// Sample NIDA owner lookup function (replace with actual implementation)
const getNidaOwner = async (nida_number) => {
  const result = await pool.query(
    "SELECT name FROM users WHERE nida_number = $1",
    [nida_number]
  );
  return result.rows.length ? result.rows[0].name : "Unknown";

  // if (nida_number === "12345678901234567890") {
  //   return "David Denis";
  // } else {
  //   return "Unknown";
  // }
};

// Sample loan application status check (replace with actual implementation)
const checkLoanApplicationStatus = async (nida_number) => {
  const result = await pool.query(
    "SELECT status FROM loans WHERE nida_number = $1",
    [nida_number]
  );

  return result.rows.length ? result.rows[0].status : "not_found";
  // if (nida_number === "12345678901234567890") {
  //   return "received";
  // } else {
  //   return "not_found";
  // }
};

// Sample debt lookup function (replace with actual implementation)
const getDebtAmount = async (nida_number) => {
  const result = await pool.query(
    "SELECT total_debt FROM debts WHERE nida_number = $1",
    [nida_number]
  );
  return result.rows.length ? result.rows[0].total_debt : "You have no debt.";

  // if (nida_number === "12345678901234567890") {
  //   return 100000;
  // } else {
  //   return "You have no debt.";
  // }
};

app.get("/api/test", (req, res) => {
  res.send("Testing Server");
});

app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const userInputs = text.split("*");
  const nida_number = userInputs[0]; // Keep the first entry as the NIDA number
  const selection = userInputs.length > 1 ? userInputs.slice(1).join("*") : ""; // Handle menu inputs correctly

  let response = "";

  if (text === "") {
    response = `CON Welcome to the Mobile OLAMS.
        Please enter your NIDA number`;
  } else if (text.length === 20 && !isNaN(text)) {
    // Validate NIDA number (20 digits)
    const nida_owner = await getNidaOwner(nida_number);

    response = `CON Hello ${nida_owner}, how do you wish to proceed?
        1. Apply for Loan
        2. Request Loan Application Status
        3. Request Debt amount`;
  } else if (selection === "1") {
    response = `CON Apply for Loan
        Do You consent that ${nida_number} is your Application Number?
        1. Yes
        2. No`;
  } else if (selection === "1*1") {
    response = `CON Yes
        An amount of 40,000 Tsh will be required to access this service. Are you ready to pay?
        1. Yes, proceed
        2. Cancel`;
  } else if (selection === "1*1*1") {
    response = `CON Enter your PIN to confirm payment of 40,000 Tsh to HESLB-Mobile OLAMS`;
  } else if (selection === "1*1*1*your_pin") {
    // Replace 'your_pin' with actual PIN validation logic
    response = `END Payment Successful and Application Submitted!!!
        Please check your Beneficiary Loan Status to approve your submitted application status.
        Thank you for using our services.`;
  } else if (selection === "1*2") {
    response = `END No
        Please confirm and re-enter your NIDA number for successful Loan Applications.`;
  } else if (selection === "2") {
    response = `CON Beneficiary Loan Status
        Do you consent that ${nida_number} is your Application number?
        1. Yes
        2. No`;
  } else if (selection === "2*1") {
    const loan_status = await checkLoanApplicationStatus(nida_number);
    response =
      loan_status === "received"
        ? `END Your Submission for Loan Application has been received successfully!
        Good luck on your application.`
        : `END No loan applications have been received from NIDA number "${nida_number}". Submit Loan applications for status verification.`;

    // if (loan_status === "received") {
    //   response = `END Your Submission for Loan Application have been received successfully!
    //       Goodluck on your applications.`;
    // } else {
    //   response = `END No loan applications have been recieved from this NIDA number "${nida_number}". Submit Loan applications for Status Verification.`;
    // }
    // } else if (selection === "2*2") {
    //   response = `END No
    //       Please confirm and re-enter your NIDA number for successful Loan Applications.`;
  } else if (selection === "3") {
    response = `CON Request Debt Amount Status:
        Do you consent that ${nida_number} is your Application number?
        1. Yes
        2. No`;
  } else if (selection === "3*1") {
    const total_debt = await getDebtAmount(nida_number); //Use correct NIDA number
    response =
      total_debt === "You have no debt."
        ? `END ${total_debt}`
        : `END Your total debt is ${total_debt} Tsh. Please pay in due time to assist other students.`;
  } else {
    response = `END Invalid input. Please try again.`;
  }

  res.set("Content-Type: text/plain");
  res.send(response);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`USSD Server running on http://localhost:${PORT}`);
});
