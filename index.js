const express = require("express");
const { Pool } = require("pg");
const app = express();
const sendSMS = require("./SMS.js");

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
  // Fetch guarantor details
  const guarantorResult = await pool.query(
    "SELECT guarantor_name, guarantor_phone FROM guarantor_approvals WHERE nida_number = $1",
    [nida_number]
  );

  if (!guarantorResult.rows.length) return "Guarantor not found.";

  const guarantor_name = guarantorResult.rows[0].guarantor_name;
  const guarantor_phone = guarantorResult.rows[0].guarantor_phone;
  const otp = generateOTP();

  // Store OTP in the guarantor approvals table
  await pool.query(
    "INSERT INTO guarantor_approvals (nida_number, guarantor_name, guarantor_phone, otp_code) VALUES ($1, $2, $3, $4) ON CONFLICT (nida_number) DO UPDATE SET otp_code = $4, confirmed = FALSE",
    [nida_number, guarantor_name, guarantor_phone, otp]
  );

  // Send SMS with OTP including the guarantor's name
  sendSMS(
    guarantor_phone,
    `Dear ${guarantor_name}, please confirm the loan request for applicant with NIDA Number ${nida_number} using this OTP: ${otp}.`
  );
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
  } else if (totalDebt > 0) {
    response = `END You are not eligible for loan application as you have an outstanding debt.
      Please clear your debt  of ${totalDebt} Tsh first before applying for a new loan.`;
  } else if (!hasAppliedForUniversity) {
    response = `END You are not eligible for loan application as you have not applied to any university yet.
      Please apply for a university first before applying for a loan.`;
  } else if (selection === "1") {
    response = `CON Welcome ${nida_owner}, how do you wish to proceed?
      1. Apply for Loan
      2. Request Loan Application Status
      3. Request Debt amount
      4. Confirm Sponsorship`;
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

    if (enteredPin === validPin) {
      response = `END Payment Successful and Application Submitted!
        Your guarantor has been notified and will need to confirm your loan sponsorship.`;
      // Call function to generate and send OTP to the guarantor
      await sendGuarantorOTP(nida_number);

      sendSMS(
        phoneNumber,
        `Your loan application is now pending. Your guarantor has been sent an OTP for confirmation.`
      );
    } else {
      response = `END Invalid PIN. Please try again.`;
    }
  } else if (selection === "1*1*2") {
    response = `END Cancel
        Thank you for using for our service. Hope to see you again.`;
  } else if (selection === "1*2") {
    if (loan_status === "received") {
      response = `END Your submsission for Loan Application has been received successfully.
      Goodluck with your application.`;
      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner}, your loan application has been received successfully. Good luck with your application.`
        );
      }
    } else if (loan_status === "pending") {
      response = `END Your loan application is still under review.
      A SMS notification will be sent to you once your application has been reviewed.`;
      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner}, your loan application is still under review. A SMS notification will be sent to you once your application has been reviewed.`
        );
      }
    } else {
      response = `END No loan application has been received for your NIDA number ${nida_number}.
      Submit loan applications for Status verification`;

      if (userPhoneNumber) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner}, no loan application has been received for your NIDA number ${nida_number}. Submit loan applications for Status verification`
        );
      }
    }
  } else if (selection === "1*3") {
    const total_debt = await getDebtAmount(nida_number); // Use correct NIDA number
    response =
      total_debt === null
        ? `END ${total_debt}`
        : `END Your total debt is ${total_debt} Tsh. Please pay any debts owed in due time to assist other students.`;

    if (userPhoneNumber) {
      if (total_debt === null) {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner}, you currently have no outstanding debt. Thank you for staying up to date with your payments.`
        );
      } else {
        sendSMS(
          userPhoneNumber,
          `Dear ${nida_owner}, your total outstanding debt is ${total_debt} Tsh. Please make payments promptly to assist other students.`
        );
      }
    }
  } else if (selection === "1*4") {
    response = `CON Please enter the OTP sent to your registered phone number.`;
  } else if (selection.startsWith("1*4*")) {
    const enteredOTP = selection.split("*")[2];

    // Fetch OTP and guarantor details
    const otpResult = await pool.query(
      "SELECT guarantor_name, confirmed FROM guarantor_approvals WHERE nida_number = $1 AND otp_code = $2",
      [nida_number, enteredOTP]
    );

    if (!otpResult.rows.length) {
      response = `END Invalid OTP. Please check your SMS and enter the correct code.`;
    } else {
      const guarantor_name = otpResult.rows[0].guarantor_name;

      await pool.query(
        "UPDATE guarantor_approvals SET confirmed = TRUE WHERE nida_number = $1",
        [nida_number]
      );

      await pool.query(
        "UPDATE loans SET status = 'received' WHERE nida_number = $1",
        [nida_number]
      );

      response = `END Loan application approved by guarantor ${guarantor_name}. Your loan status is now RECEIVED.`;

      sendSMS(
        phoneNumber,
        `Your loan application has been confirmed by ${guarantor_name}.`
      );
    }
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
