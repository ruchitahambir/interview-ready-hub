🚀 PrepIQ - AI-Powered Interview Assistant
PrepIQ is a streamlined application designed to help job seekers prepare for interviews by generating personalized interview briefs. By analyzing a user's Resume and the Job Description (JD), the app provides actionable insights directly on the dashboard and delivers a copy via email.

🛠️ Tech Stack
Frontend: React + Vite (via Lovable)

Styling: Tailwind CSS + shadcn/ui

Automation: n8n (Workflow Automation)

Backend/Database: Supabase

Email: Gmail API integration via n8n

✨ Features
Smart Parsing: Upload your Resume and paste a Job Description to get started.

AI Interview Brief: Generates a custom preparation guide tailored to the specific role and your background.

Instant Sync: View your brief immediately on the PrepIQ dashboard.

Automated Delivery: Automatically receives an email copy of your brief via the n8n automation pipeline.

🏗️ Architecture & Workflow
The app follows a modern "Low-Code + Pro-Code" hybrid architecture:

Trigger: User inputs data into the Lovable-built frontend.

Processing: Lovable sends a POST request with the generated brief and user email to an n8n Webhook.

Automation: * The n8n workflow parses the incoming JSON.

Formats the content for email delivery.

Action: The Gmail Node sends the final interview brief to the user's inbox.

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
📸 Screenshots
(Add screenshots of your UI and n8n workflow here for better visual appeal)

🤝 Contributing
Feel free to open issues or submit pull requests to help improve the AI prompt logic or UI components.

Built with ❤️ by Ruchita Hambir
