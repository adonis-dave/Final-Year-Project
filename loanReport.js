const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "postgres",
  password: "mi vida",
  port: 5432,
});

const generatePDF = async (reportData) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });

    doc.on("error", (err) => reject(err));

    // Add content to the PDF
    doc.fontSize(16).text("Loan Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`NIDA Number: ${reportData.nida_number}`);
    doc.text(`Applicant Name: ${reportData.applicant_name}`);
    doc.text(`Loan ID: ${reportData.loan_id}`);
    doc.text(`Guarantor NIDA: ${reportData.guarantor_nida}`);
    doc.text(`Guarantor Approved: ${reportData.guarantor_approved}`);
    doc.text(`Application Date: ${reportData.application_date}`);
    doc.moveDown();
    doc.text("Report Data:");
    doc.text(JSON.stringify(reportData.report_data, null, 2), { width: 500 });

    doc.end();
  });
};

const sendEmailWithPDF = async (email, pdfData) => {
  const transporter = nodemailer.createTransport({
    service: "gmail", // Use your email provider
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS, // Your email password or app-specific password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "HESLB Loan Application Report",
    text: "Please find the attached loan application report.",
    attachments: [
      {
        filename: "Loan_Report.pdf",
        content: pdfData,
        contentType: "application/pdf",
      },
    ],
  };

  await transporter.sendMail(mailOptions);
};

const sendLoanReport = async (nida_number, email) => {
  try {
    // Fetch the report data from the database
    const result = await pool.query(
      "SELECT * FROM loan_reports WHERE nida_number = $1",
      [nida_number]
    );

    if (!result.rows.length) {
      console.error("No report found for the given NIDA number.");
      return;
    }

    const reportData = result.rows[0];

    // Generate the PDF
    const pdfData = await generatePDF(reportData);

    // Send the email with the PDF attachment
    await sendEmailWithPDF(email, pdfData);

    console.log("Loan Application report sent successfully!");
  } catch (error) {
    console.error("Error sending loan application report:", error);
  }
};

module.exports = { sendLoanReport };