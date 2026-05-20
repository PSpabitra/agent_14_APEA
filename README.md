# APEA - Autonomous Problem Engine for Action (Frontend)

Welcome to the **APEA Frontend** project. This is a modern, enterprise-ready React application built with Vite, designed to serve as an intelligent **Incident Management and Root Cause Analysis (RCA) Dashboard**. 

Powered by advanced AI capabilities (including Gemini-integrated RAG models and Vector databases on the backend), this intuitive dashboard enables technical teams to observe, analyze, and resolve production incidents with unprecedented speed and accuracy.

## 🚀 Key Features

- **Dynamic Incident Management Dashboard**: A centralized hub to track and manage active incidents (Tickets).
- **Automated Root Cause Analysis (RCA)**: Visualize the underlying causes of incidents with AI-driven insights. 
- **The "Incident Loop" (Observe, Reason, Act)**: A beautiful, dynamic vertical progress stepper (similar to modern e-commerce tracking) ensuring transparent investigation workflows.
- **Runbooks & Knowledge Base (RAG Integration)**: Upload, manage, and search through Runbooks and Articles (supporting CSV, TXT, DOCX, PDF). The integrated AI assistant uses these documents for context-aware resolutions.
- **Integrations & Connectors**: Seamlessly connect with third-party tools and data sources.
- **AI Chatbot Console**: Conversational interface for querying incident metadata, runbooks, and receiving actionable remediation steps.
- **Reporting & Exceptions**: Granular metrics, KPI visualizations, and exception monitoring.

## 🛠 Tech Stack

- **Framework**: React 18 & Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Framer Motion (for polished, dynamic micro-animations)
- **State Management**: Zustand and React Query
- **Routing**: React Router DOM
- **Forms**: React Hook Form + Zod (Validation)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest & Playwright

## 📂 Project Structure

- `src/components/`: Reusable, atomic UI components.
- `src/pages/`: Core application views (`Dashboard`, `Tickets`, `RCA`, `Connectors`, `Chatbot`, etc.).
- `src/services/`: API integration and data fetching logic setup for production environments.
- `src/store/`: Zustand global state slices.
- `src/hooks/`: Custom React hooks for business logic.

## 🏃‍♂️ Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Ensure your `.env` file is appropriately populated with backend API URLs (e.g., pointing to your corresponding APEA Python/MySQL backend).

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🎨 Design Philosophy
The APEA frontend is built with a focus on **visual excellence**, providing a premium, highly responsive user experience. Custom scrollbars, debounced search filters, fluid animations, and a light-themed interface ensure that operators can navigate complex system data clearly and efficiently.
