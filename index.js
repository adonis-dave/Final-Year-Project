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
  try {
    const result = await pool.query(
      "SELECT name FROM users WHERE nida_number = $1",
      [nida_number]
    );
    return result.rows.length ? result.rows[0].name : null;
  } catch (error) {
    console.error("Database error (getNidaOwner):", error);
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
    return result.rows.length ? result.rows[0].total_debt : "You have no debt.";
  } catch (error) {
    console.error("Database error (getDebtAmount):", error);
    return "Error fetching debt amount";
  }
};

const validateNidaNumber = (nida_number) => {
  if (!/^\d{20}$/.test(nida_number)) {
    return false; // Invalid NIDA number
  }
  return true; // Valid NIDA number
};

app.get("/api/test", (req, res) => {
  res.send("Testing Server");
});

app.post("/ussd", async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const userInputs = text.split("*");
  const nida_number = userInputs[0]; // Keep the first entry as the NIDA number
  const selection = userInputs.length > 1 ? userInputs.slice(1).join("*") : ""; // Handle menu inputs correctly
  const nida_owner = await getNidaOwner(nida_number);

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
    response = `CON Hello "${nida_owner}", do you confirm that "${nida_number}" is your Application Number?
          1. Yes
          2. No`;
  } else if (selection === "1") {
    response = `CON Welcome ${nida_owner}, how do you wish to proceed?
        1. Apply for Loan
        2. Request Loan Application Status
        3. Request Debt amount`;
  } else if (selection === "2") {
    // If the user does not confirm their NIDA number, prompt them to re-enter
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
    response =
      enteredPin === validPin
        ? `END Payment Successful and Application Submitted!!!
          Please check your Beneficiary Loan Status to approve your submitted application status.`
        : `END Invalid PIN. Please try again.`;
  } else if (selection === "1*1*2") {
    response = `END Cancel
        Thank you for using for our service. Hope to see you again.`;
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
