const AfricasTalking = require("africastalking");
require("dotenv").config();
// Initialize Africa's Talking SDK
const africastalking = AfricasTalking({
  // apiKey: process.env.AT_API_KEY,
  // username: process.env.AT_USERNAME, // Use 'sandbox' for testing
  apiKey: "atsk_2cdea2d43410db00f890b0acd1760b1be0c792d9ed24d19e5dc5ba9213546082e790bd56",
  username: "Heslb",
});

module.exports = async function sendSMS(number, message) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const result = await africastalking.SMS.send({
        to: number,
        message: message,
        from: 'INFORM',
      });
      console.log(result);
      return; // Exit if successful
    } catch (ex) {
      attempts++;
      console.error(`SMS sending failed (attempt ${attempts}):`, ex);
      if (attempts >= maxAttempts) {
        console.error("Max retry attempts reached. SMS not sent.");
      }
    }
  }
};
