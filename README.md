<a name="readme-top"></a>

<div align="center">
  <h1>USSD Loan Application System</h1>
  <br/>

  <h3><b>Final Year Project</b></h3>
</div>

<!-- TABLE OF CONTENTS -->

# 📗 Table of Contents

- [📖 About the Project](#about-project)
  - [🛠 Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
  - [🚀 Live Demo](#live-demo)
- [💻 Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Install](#install)
  - [Usage](#usage)
  - [Run tests](#run-tests)
  - [Deployment](#deployment)
- [👥 Authors](#authors)
- [🔭 Future Features](#future-features)
- [🤝 Contributing](#contributing)
- [⭐️ Show your support](#support)
- [🙏 Acknowledgements](#acknowledgements)
- [📝 License](#license)

<!-- PROJECT DESCRIPTION -->

# 📖 USSD Loan Application System <a name="about-project"></a>

The **USSD Loan Application System** is a backend application designed to streamline loan applications, approvals, and reporting. It allows users to apply for loans via a USSD interface, enables guarantors to approve applications via OTPs, and generates PDF reports for loan applications. The system also sends notifications via SMS and email to ensure smooth communication between applicants, guarantors, and administrators.

## 🛠 Built With <a name="built-with"></a>

### Tech Stack <a name="tech-stack"></a>

<details>
  <summary>Backend</summary>
  <ul>
    <li>Node.js</li>
    <li>Express.js</li>
  </ul>
</details>

<details>
  <summary>Database</summary>
  <ul>
    <li>PostgreSQL</li>
  </ul>
</details>

<details>
  <summary>APIs</summary>
  <ul>
    <li>Africa's Talking (SMS API)</li>
    <li>Nodemailer (Email API)</li>
  </ul>
</details>

<!-- Features -->

### Key Features <a name="key-features"></a>

- **USSD Loan Application**: Users can apply for loans via a USSD interface.
- **Guarantor Approval**: Guarantors receive OTPs via SMS to approve loan applications.
- **Loan Reports**: Automatically generates loan reports and sends them via email as PDF attachments.
- **SMS Notifications**: Sends SMS notifications to users and guarantors using Africa's Talking API.
- **Dynamic Guarantor Validation**: The system fetches the guarantor's NIDA number from the `guarantor_approvals` table and validates OTPs for loan approval.
- **Email Notifications**: Sends detailed loan application reports to administrators or stakeholders via email.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LIVE DEMO -->

## 🚀 Live Demo <a name="live-demo"></a>

> This project is deployed via USSD "*149*46*20#" for Vodacom, Airtel and Tigo lines.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## 💻 Getting Started <a name="getting-started"></a>

To get a local copy up and running, follow these steps.

### Prerequisites

In order to run this project, you need:

- Node.js installed on your machine.
- PostgreSQL database set up and running.
- Africa's Talking API credentials.
- Gmail account for sending emails.

### Setup

Clone this repository to your desired folder:

```sh
  git clone https://github.com/adonis-dave/Final-Year-Project.git
  cd final-year-project
```

### Install

Install the required dependencies:

```sh
  npm install africastalking, ngrok, express, nodemailer, pdfkit, nodemon, pg
```

### Usage

To run the project, execute the following command:

```sh
  npm run dev
```

### Deployment

This project is not currently deployed. You can deploy it using services from Africa's Talking.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- AUTHORS -->

## 👥 Authors <a name="authors"></a>

> Mention all of the collaborators of this project.

👤 **David Denis**

- GitHub: [@adonis-dave](https://github.com/adonis-dave)
- Twitter: [@twitterhandle](https://twitter.com/twitterhandle)
- LinkedIn: [LinkedIn](https://linkedin.com/in/linkedinhandle)



<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- FUTURE FEATURES -->

## 🔭 Future Features <a name="future-features"></a>

- **Thinking of adding AI in the system.....**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## 🤝 Contributing <a name="contributing"></a>

Contributions, issues, and feature requests are welcome!

Feel free to check the [issues page](../../issues/).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SUPPORT -->

## ⭐️ Show your support <a name="support"></a>

> A lot of thanks to the Africa's Talking team for their amazing support throught their USSD and SMS APIs. More of the thanks to my University supervisor on his tutorage in finally completing this project.

If you like this project, you can reach out to me in the contacts available on my profile

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGEMENTS -->

## 🙏 Acknowledgments <a name="acknowledgements"></a>

> @AfricasTalking and @Savanna Devs for their spark in making this idea possible, I highly acknowledge you.

I would like to thank Africa's Talking API at large for their great help in this project.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- LICENSE -->

## 📝 License <a name="license"></a>

This project is [MIT](./LICENSE) licensed.


<p align="right">(<a href="#readme-top">back to top</a>)</p>
