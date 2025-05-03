const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sample NIDA owner lookup function (replace with actual implementation)
const getNidaOwner = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to fetch nida_owner
  // from your database or API.
  if (nidaNumber === "1234567890") {
    return "John Doe";
  } else {
    return "Unknown";
  }
};

// Sample debt lookup function (replace with actual implementation)
const getDebtAmount = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to fetch debt amount
  // from your database or API.
  if (nidaNumber === "1234567890") {
    return 100000;
  } else {
    return "You have no debt.";
  }
};

// Sample loan application status check (replace with actual implementation)
const checkLoanApplicationStatus = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to check loan application status
  // from your database or API.
  if (nidaNumber === "1234567890") {
    return "received";
  } else {
    return "not_found";
  }
};

app.get("/api/test", (req, res) => {
  res.send("Testing Server");
});

app.post("/ussd", (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body;

  const userInputs = text.split("*");
  const selection = userInputs.length > 1 ? userInputs.slice(1).join("*") : ""; // Handle menu inputs correctly
  const nidaNumber = userInputs[0]; // Keep the first entry as the NIDA number
  const nidaOwner = getNidaOwner(nidaNumber);

  let response = "";

  if (text === "") {
    response = `CON Welcome to the Mobile OLAMS.
        Please enter your NIDA number`;
  } else if (text.length === 10 && !isNaN(text)) {
    // Validate NIDA number (10 digits)

    response = `CON Hello ${nidaOwner}, how do you wish to proceed?
        1. Apply for Loan
        2. Request Beneficiary Loan Status
        3. Request Debt amount`;
  } else if (selection === "1") {
    response = `CON Apply for Loan
        Do You consent that ${nidaNumber} is your Application Number?
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
    response = `CON No
        Please confirm and re-enter your NIDA number for successful Loan Applications.
        Enter 0 to go back and re enter your NIDA number`;
  } else if (selection === "2") {
    response = `CON Beneficiary Loan Status
        Do you consent that ${nidaNumber} is your Application number?
        1. Yes
        2. No`;
  } else if (selection === "2*1") {
    const loanApplicationStatus = checkLoanApplicationStatus(text);
    if (loanApplicationStatus === "received") {
      response = `END Your Submission for Loan Application have been received successfully!
          Goodluck on your applications.`;
    } else {
      response = `END No loan applications have been recieved from this ${text}. Submit Loan applications for Status Verification
          Enter 0 to go to the Main Menu`;
    }
  } else if (selection === "2*2") {
    response = `CON No
        Please confirm and re-enter your NIDA number for successful Loan Applications.
        Enter 0 to go back and re enter your NIDA number`;
  } else if (selection === "3") {
    response = `CON Request Debt Amount Status:
        Do you consent that ${nidaNumber} is your Application number?
        1. Yes
        2. No`;
  } else if (selection === "3*1") {
    const debtAmount = getDebtAmount(nidaNumber); //Use correct NIDA number
    if (debtAmount === "You have no debt.") {
      response = `END ${debtAmount}`;
    } else {
      response = `END Your total debt is ${debtAmount} Tsh. Please pay in due time to assist other students.`;
    }
  } else if (selection === "3*2") {
    response = `CON No
        Please confirm and re-enter your NIDA number for successful Loan Applications.
        Enter 0 to go back and re enter your NIDA number`;
  } else if (selection === "0") {
    response = `CON Welcome to the Mobile OLAMS.
        Please enter your NIDA number`;
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
