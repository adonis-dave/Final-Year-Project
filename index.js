const express = require("express");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Sample NIDA owner lookup function (replace with actual implementation)
const getNidaOwner = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to fetch nida_owner
  // from your database or API.
  if (nidaNumber === "12345678901234567890") {
    return "David Denis";
  } else {
    return "Unknown";
  }
};

// Sample debt lookup function (replace with actual implementation)
const getDebtAmount = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to fetch debt amount
  // from your database or API.
  if (nidaNumber === "12345678901234567890") {
    return "100,000 Tsh";
  } else {
    return null;
  }
};

// Sample loan application status check (replace with actual implementation)
const checkLoanApplicationStatus = (nidaNumber) => {
  // This is a placeholder. Replace with your actual logic to check loan application status
  // from your database or API.
  if (nidaNumber === "12345678901234567890") {
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

  let response = "";

  // Check if the user has entered their NIDA number
  if (text.length === 0) {
    // Always prompt the user to enter their NIDA number first
    response = `CON Welcome to the Mobile OLAMS.
        Please enter your NIDA number`;
  } else if (text.length === 20 && !isNaN(text)) {
    // Validate NIDA number (20 digits)
    const nidaNumber = text;
    const nidaOwner = getNidaOwner(nidaNumber);

    if (nidaOwner === "Unknown") {
      // If the NIDA number is invalid, prompt the user to re-enter
      response = `END The NIDA number you entered is not recognized.
            Please re-enter your NIDA number or contact support for assistance.`;
    } else {
      // If the NIDA number is valid, proceed to the main menu
      response = `CON Hello ${nidaOwner}, how do you wish to proceed?
            1. Apply for Loan
            2. Request Beneficiary Loan Status
            3. Request Debt amount`;
    }
  } else {
    // Handle invalid input (e.g., non-numeric or incorrect length)
    response = `END Invalid input. Please enter a valid 20-digit NIDA number.`;
  }

  res.set("Content-Type: text/plain");
  res.send(response);
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`USSD Server running on http://localhost:${PORT}`);
});
