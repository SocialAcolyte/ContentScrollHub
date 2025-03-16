
# ThinkTok Web Application

A web application built with React, Express, and TypeScript that fetches and displays content from various sources.

## Setup and Development

### Prerequisites
- A Replit account
- Node.js environment (provided by Replit)

### Getting Started

1. Fork this project on Replit
2. Click the "Run" button to install dependencies and start the development server
3. The application will be available at port 5000

### Local Development

After forking, the development server will:
- Run the frontend dev server (Vite)
- Run the backend server (Express)
- Watch for file changes and hot reload

## Project Structure

```
├── client/          # Frontend React application
├── server/          # Backend Express server
├── shared/          # Shared types and schemas
└── package.json     # Project dependencies
```

## Environment Variables

The following environment variables are required:
- `DATABASE_URL`: PostgreSQL database connection string
- `SESSION_SECRET`: Secret key for session management
- Optional: `DEVTO_API_KEY`, `GOODREADS_KEY` for additional content sources

Set these in the Replit Secrets tab (lock icon).

## Deployment

1. Click the "Deploy" button in Replit
2. Configure deployment settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. Choose a deployment plan
4. Click "Deploy" to publish your application

Your app will be deployed to a `<your-app>.replit.app` URL.

## Features

- Content aggregation from multiple sources
- Infinite scroll content viewing
- User authentication
- Session management
- Responsive design

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Express, TypeScript
- Database: PostgreSQL
- Build Tools: Vite
- Deployment: Replit

## Development Commands

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run check`: Type check TypeScript files
