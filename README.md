# MoneyDa: Intelligent Financial Analytics Platform

MoneyDa is an advanced, AI-driven personal finance application designed to automatically parse, categorize, and analyze bank statements. By leveraging state-of-the-art Large Language Models and computer vision APIs, MoneyDa transforms raw transactional data into actionable financial intelligence.

## System Architecture

The application is built on a modern, highly performant stack:
- **Frontend Framework:** Next.js 15 (React 19) with Turbopack for rapid compilation.
- **Styling:** Tailwind CSS v4 for responsive, utility-first design, including comprehensive Dark Mode support.
- **Data Visualization:** Recharts for dynamic, interactive charting of financial flows.
- **AI Integration:** Qwen 3.8 27B model for complex natural language processing and financial pattern recognition.
- **Payment Gateway:** Real-time Razorpay Payment Links API integration for contextual peer-to-peer bill splitting.
- **Currency Engine:** Real-time Foreign Exchange APIs for automated transaction localization.

## Core Capabilities

### Automated Statement Ingestion & Analytics
Upload standard bank CSV statements. The system autonomously parses the data, categorizes transactions, and maps cash flow distributions using interactive charts.
![Dashboard Analytics](./docs/dashboard_placeholder.png)

### Conversational Financial Intelligence
An integrated AI Chatbot that possesses full contextual awareness of your transactional history. It can answer specific queries regarding spending habits, identify surge pricing, and flag impulse purchases.

### Dynamic Payment Link Generation (Razorpay)
The application bridges generative AI with the Razorpay API. If you request the AI to split a bill from your ledger, it mathematically divides the sum and automatically generates a live, secure Razorpay Payment Link directly within the chat interface.

### Optical Receipt Parsing with Currency Localization
Upload images of physical receipts. The computer vision pipeline extracts the merchant and the precise transaction amount. If the receipt is in a foreign currency, the system intercepts the value, retrieves current market exchange rates, and automatically converts the total into your preferred local currency.

### Fraud & Anomaly Detective
The system proactively sweeps the ledger for duplicate charges and subscription price increases. It identifies potential security risks and features a one-click protocol to generate a formalized, legal dispute email to the merchant.
![Fraud Detective](./docs/detective_placeholder.png)

### Time-Travel Wealth Simulator
A predictive modeling interface that evaluates your current monthly savings rate. By manipulating the timeline slider, the system calculates and compares the future value of your capital under a standard savings protocol versus a compound interest investment strategy.
![Wealth Simulator](./docs/simulator_placeholder.png)

## Installation & Deployment

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn package manager
- Razorpay API Keys (Test or Live)
- Groq API Key (for Qwen model access)

### Local Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/Sharveswar007/MoneyDa.git
   cd MoneyDa
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory and populate it with your credentials:
   ```env
   GROQ_API_KEY=your_groq_api_key
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```

4. **Initialize the Development Server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## Production Deployment
The repository is optimized for immediate deployment on Vercel. Ensure that your environment variables are securely added to the Vercel project settings prior to initiating the build process.

---
*Developed for the Razorpay Hackathon.*
