🚀 PrepIQ - AI-Powered Interview Assistant
<p align="center">
  <img width="250" " alt="PrepIQ Icon" src="https://github.com/user-attachments/assets/8cca6526-e2ff-434e-974c-61de2aa9870d" />
</p>

PrepIQ is a streamlined application designed to help job seekers prepare for interviews by generating personalized interview briefs. By analyzing a user's Resume and the Job Description (JD), the app provides actionable insights directly on the dashboard and delivers a copy via email.

****************************************************************************************************************************************************************************
🛠️ Tech Stack
Frontend: React + Vite (via Lovable)

Styling: Tailwind CSS + shadcn/ui

Automation: n8n (Workflow Automation)

Backend/Database: Supabase

Email: Gmail API integration via n8n

****************************************************************************************************************************************************************************
✨ Features
Smart Parsing: Upload your Resume and paste a Job Description to get started.

AI Interview Brief: Generates a custom preparation guide tailored to the specific role and your background.

Instant Sync: View your brief immediately on the PrepIQ dashboard.

Automated Delivery: Automatically receives an email copy of your brief via the n8n automation pipeline.

****************************************************************************************************************************************************************************
🏗️ Architecture & Workflow
The app follows a modern "Low-Code + Pro-Code" hybrid architecture:

Trigger: User inputs data into the Lovable-built frontend.

Processing: Lovable sends a POST request with the generated brief and user email to an n8n Webhook.

Automation: * The n8n workflow parses the incoming JSON.

Formats the content for email delivery.

Action: The Gmail Node sends the final interview brief to the user's inbox.

****************************************************************************************************************************************************************************
🚀 Getting Started
Prerequisites
Bun or Node.js installed.

A Supabase project for backend services.

An active n8n instance for the automation logic.

Installation
Clone the repository:

Bash
git clone https://github.com/ruchitahambir/interview-ready-hub.git
cd interview-ready-hub
Install dependencies:

Bash
bun install
Set up environment variables:
Create a .env file and add your Supabase and API credentials.

Run the development server:

Bash
bun run dev

****************************************************************************************************************************************************************************
PrepIQ - Landing Page 
<p align="center">
<img src="https://github.com/user-attachments/assets/e3977b35-af95-4d2b-90ce-0e0c55df1b65" alt="UI-PrepIQ"  width="600">
</p>
PrepIQ- One Page Brief Generated 
<p align="center">
<img width="600" alt="UI-Brief page" src="https://github.com/user-attachments/assets/bf0d1ec1-72c3-4b2d-9cfe-b36607527e91" />
</p>
N8n Workflow:
<p align="center">
<img width="600" alt="n8n-workflow" src="https://github.com/user-attachments/assets/2519a6b9-8ca5-4a95-a6be-64098517447b" />
</p>

**************************************************************************************************************************************************************************
🗺️ Future Roadmap (Recruiter-Centric)
To further streamline the talent acquisition process, the following features are planned:

Batch Processing: Upload multiple resumes at once to get a ranked list of candidates against a single Job Description.

Weighted Scoring: Allow recruiters to "weight" specific skills (e.g., "Must have OutSystems experience") to calculate a custom Match Score.

Automated HR Interview Questions: Generate a set of targeted screening questions for the recruiter to ask based on the gaps found between the resume and JD.

ATS Integration: Connect directly with popular Applicant Tracking Systems to pull resumes and push candidate briefs automatically.

LinkedIn Profile Scraping: An extension to pull data directly from a candidate’s LinkedIn profile to compare against the JD without needing a PDF resume.
****************************************************************************************************************************************************************************
🤝 Contributing
Feel free to open issues or submit pull requests to help improve the AI prompt logic or UI components.

Built with ❤️ by Ruchita Hambir
