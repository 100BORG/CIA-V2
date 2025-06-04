# CIA-V2

A professional enterprise-grade invoice management system with dual currency support (USD and INR), built with React and Vite.

## Table of Contents
- [Features](#features)
- [Setup and Installation](#setup-and-installation)
  - [Local Development](#local-development)
  - [Development Environment](#development-environment)
  - [Production Deployment](#production-deployment)
- [Environment Variables](#environment-variables)
- [Database Setup (Supabase)](#database-setup-supabase)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- **Dual Currency Support**: Generate invoices in both USD and INR with automatic currency conversion
- **PDF Generation**: Create professional PDFs for invoices
- **Email Integration**: Send invoices directly via email using EmailJS
- **Client Management**: Store and manage client information
- **Invoice Templates**: Multiple professional invoice templates
- **Responsive Design**: Works on desktop and mobile devices
- **Supabase Integration**: Cloud database for storing invoices, clients, and user data
- **Authentication**: User authentication and role-based permissions
- **Dark Mode**: Toggleable dark/light theme

## Setup and Installation

### Local Development

#### Prerequisites
- **Node.js** v14.0.0 or higher
- **npm** (comes with Node.js) or **yarn**
- **Git** for cloning the repository

#### Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/CIA-V2.git
   cd CIA-V2
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory with the following variables:
   ```
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EXCHANGE_RATE_API_KEY=your_exchange_rate_api_key
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the Development Server**
   ```bash
   # Option 1: Frontend development only (Vite dev server)
   npm run dev
   # or
   yarn dev
   ```
   
   This will start the Vite development server at [http://localhost:5173](http://localhost:5173)

   ```bash
   # Option 2: Full stack development (Express server + built frontend)
   npm run dev:full
   # or
   yarn dev:full
   ```
   
   This builds the frontend and starts the Express server at [http://localhost:3000](http://localhost:3000)

### Development Environment

For working with different aspects of the development environment:

1. **Frontend Only (Rapid Development)**
   ```bash
   npm run dev
   # or
   yarn dev
   ```
   
   Use this during active frontend development for hot reloading.

2. **Backend Only (API Development)**
   ```bash
   # Start the Express server in watch mode
   npm run serve
   # or
   yarn serve
   ```
   
   This will start the Express server at [http://localhost:3000](http://localhost:3000) and automatically restart when server code changes.

3. **Full Stack (Frontend + Backend)**
   ```bash
   # Build the frontend and start the server
   npm run dev:full
   # or
   yarn dev:full
   ```
   
   This is the recommended option for testing the complete application.

### Production Deployment

#### Netlify Deployment

1. **Connect your GitHub repository to Netlify**
   - Sign up or log in to [Netlify](https://netlify.com/)
   - Click "New site from Git" and select your GitHub repository
   - Follow the authorization steps if prompted

2. **Configure Build Settings**
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - Deploy with these settings

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add all the required environment variables listed in the [Environment Variables](#environment-variables) section
   - Save changes and trigger a new deploy

4. **Verify Deployment**
   - Check the Netlify deployment logs for any issues
   - Visit your deployed site at the provided Netlify URL

The `netlify.toml` file in the repository already has the correct configuration for Netlify deployments.

#### Render Deployment

1. **Sign Up and Connect to GitHub**
   - Sign up or log in to [Render](https://render.com/)
   - Connect your GitHub account and select the repository

2. **Create a New Web Service**
   - Choose "Web Service" as the service type
   - Select the repository and branch

3. **Configure Build Settings**
   - **Name**: Choose a name for your service (e.g., "cia-invoice-generator")
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.js`

4. **Set Environment Variables**
   - Add all the required environment variables from the [Environment Variables](#environment-variables) section
   - Save changes and deploy

5. **Verify Deployment**
   - Check the deployment logs for any issues
   - Visit your deployed app at the provided Render URL

The `render.yaml` file in the repository already contains the necessary configuration for Render.

#### Manual Deployment

1. **Build the Project**
   ```bash
   npm run build
   # or
   yarn build
   ```

2. **Deploy to Your Server**
   - Upload the following to your web server:
     - `dist/` directory (contains the built frontend)
     - `server.js` file
     - `package.json` file
     - `node_modules/` directory (or run `npm install --production` on the server)

3. **Set Up Environment Variables**
   - Configure environment variables on your server
   - Ensure all required variables are set

4. **Start the Server**
   ```bash
   node server.js
   ```
   
   Or use a process manager like PM2:
   ```bash
   # Install PM2 globally if not already installed
   npm install -g pm2
   
   # Start the application
   pm2 start server.js --name "cia-invoice-app"
   
   # Ensure it starts on system reboot
   pm2 startup
   pm2 save
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_EMAILJS_PUBLIC_KEY` | Public key for EmailJS service | Yes |
| `VITE_EMAILJS_SERVICE_ID` | Service ID for EmailJS | Yes |
| `VITE_EMAILJS_TEMPLATE_ID` | Email template ID for EmailJS | Yes |
| `VITE_EXCHANGE_RATE_API_KEY` | API key for currency exchange rates | Yes |
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `PORT` | Port for Express server (default: 3000) | No |

### How to Obtain API Keys

1. **EmailJS Keys**
   - Sign up at [EmailJS](https://www.emailjs.com/)
   - Create a service and email template
   - Get your Public Key, Service ID, and Template ID from your dashboard

2. **Exchange Rate API Key**
   - Sign up at [ExchangeRate-API](https://www.exchangerate-api.com/) or another currency conversion service
   - Get your API key from the dashboard

3. **Supabase Keys**
   - Create a project at [Supabase](https://supabase.com/)
   - Find your URL and anon key in the project settings > API

## Database Setup (Supabase)

1. **Create a Supabase Project**
   - Sign up at [Supabase](https://supabase.com/)
   - Create a new project (the free tier is sufficient for development)
   - Note your project URL and anon key

2. **Set Up Database Schema**
   - Navigate to the SQL Editor in your Supabase dashboard
   - First, run the SQL scripts from `supabase_schema.sql` in the SQL editor
   - Then, run the SQL scripts from `supabase_descriptions.sql` to initialize data
   - If you encounter any schema issues, run `supabase_schema_validation.sql` to validate and fix common problems

3. **Configure Authentication**
   - Go to Authentication > Settings in your Supabase dashboard
   - Enable Email auth provider 
   - Configure email templates if needed
   - Set up any additional auth providers as needed

4. **Set Up Row Level Security (RLS)**
   - Navigate to the Auth > Policies section
   - Ensure appropriate RLS policies are in place for your tables
   - This controls access to your data based on user authentication

5. **Connect to Your Application**
   - Add the Supabase URL and anon key to your `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite development server for frontend development (hot reload) |
| `npm run build` | Build the frontend for production (outputs to `dist/` directory) |
| `npm start` | Run the production Express server (serves the built frontend) |
| `npm run serve` | Run Express server in watch mode (automatically restarts on changes) |
| `npm run dev:full` | Build the frontend and run the server in watch mode (full stack development) |
| `npm run preview` | Preview the production build locally using Vite's preview server |

## Project Structure

```
CIA-V2/
├── dist/               # Built frontend (generated after build)
├── public/             # Static assets
│   └── images/         # Image assets
├── src/                # Frontend source code
│   ├── assets/         # Frontend assets
│   ├── components/     # React components
│   ├── config/         # Configuration files
│   ├── context/        # React context providers
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Library code
│   ├── pages/          # Page components
│   ├── services/       # API and service functions
│   ├── types/          # TypeScript type definitions
│   ├── utils/          # Utility functions
│   ├── App.jsx         # Main App component
│   ├── App.css         # Main styles
│   ├── index.css       # Global styles
│   └── main.jsx        # Entry point
├── .env                # Environment variables (create this)
├── index.html          # HTML entry point
├── netlify.toml        # Netlify configuration
├── package.json        # Dependencies and scripts
├── render.yaml         # Render deployment configuration
├── server.js           # Express server
├── supabase_schema.sql # Database schema
└── vite.config.js      # Vite configuration
```

## Troubleshooting

### Common Issues

- **PDF Generation Issues**
  - Check browser console for canvas security errors
  - Ensure the page is fully loaded before generating PDFs
  - Try running in a secure context (HTTPS) if on a production server

- **Email Sending Failures**
  - Verify EmailJS credentials in your `.env` file
  - Check if you've reached EmailJS usage limits
  - Test the EmailJS template directly in their dashboard

- **Currency Conversion Problems**
  - Verify exchange rate API key and connection
  - The app uses a fallback rate of 82 INR per USD if the API fails
  - Check your API call limits if using a free tier

- **Storage Errors**
  - Ensure localStorage is enabled in your browser
  - Check if you're in incognito/private browsing mode
  - Clear browser storage if you encounter corruption issues

- **Authentication Issues**
  - Verify Supabase credentials and configuration
  - Check browser console for auth-related errors
  - Ensure Supabase services are running (check status page)

- **Express Server Not Starting**
  - Check if the specified port is already in use
  - Verify Node.js version (should be >=14.0.0)
  - Check server logs for detailed error messages

- **Supabase Schema Cache Issues**
  - If you see errors like "Could not find the 'accountName' column of 'invoices' in the schema cache":
    1. We've implemented a workaround that uses the `bankDetails` JSON field instead of direct column access
    2. Run the migration script: `supabase_migrate_bank_details.sql` in the Supabase SQL editor
    3. This script will move data from the `accountName` column to `bankDetails.accountName`
    4. The application has been updated to use the JSON field instead of the direct column
    5. Restart your application after running the script
    6. If issues persist, clear your browser cache and storage

### Diagnostic Pages

The application includes built-in diagnostic tools accessible at:
- `/debug` - Basic system and JavaScript tests
- `/diagnostic` - Storage and library test utilities

## License

MIT

---

© 2025 ML Solutions | Created with ❤️

