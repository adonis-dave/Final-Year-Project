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
  const { hasAppliedForUniversity, totalDebt } = await checkLoanEligibility(
    nida_number
  );
  const loan_status = await checkLoanApplicationStatus(nida_number);

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
  } else if (totalDebt > 0) {
    response = `END You are not eligible for loan application as you have an outstanding debt.
    Please clear your debt  of ${totalDebt} Tsh first before applying for a new loan.`;
  } else if (!hasAppliedForUniversity) {
    response = `END You are not eligible for loan application as you have not applied to any university yet.
    Please apply for a university first before applying for a loan.`;
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
  } else if (selection === "1*2") {
    if (loan_status === "received") {
      response = `END Your submsission for Loan Application has been received successfully.
      Goodluck with your application.`;
    } else if (loan_status === "pending") {
      response = `END Your loan application is still under review.
      A SMS notification will be sent to you once your application has been reviewed.`;
    } else {
      response = `END No loan application has been received for your NIDA number ${nida_number}.
      Submit loan applications for Status verification`;
    }
  } else if (selection === "1*3") {
    const total_debt = await getDebtAmount(nida_number); //Use correct NIDA number
    response =
      total_debt === "You have no debt."
        ? `END ${total_debt}`
        : `END Your total debt is ${total_debt} Tsh. Please pay any dates owed in due time to assist other students.`;
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
