# Copilot Instructions for MusicShare

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a real-time music and movie streaming web application that allows users to watch movies and listen to music together in synchronized sessions.

## Tech Stack
- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Real-time Communication**: Socket.IO for synchronized playback
- **Styling**: Tailwind CSS for modern UI components
- **Authentication**: NextAuth.js for user management
- **Database**: Prisma with PostgreSQL for user data and room management

## Key Features
- Real-time synchronized video/audio playback
- User authentication and room management
- Chat functionality during sessions
- Media upload and streaming capabilities
- Responsive design for desktop and mobile

## Code Style Guidelines
- Use TypeScript for all components and utilities
- Follow React functional components with hooks
- Use Tailwind CSS classes for styling
- Implement proper error handling and loading states
- Use Server Actions for form submissions
- Implement proper SEO with Next.js metadata API

## Architecture Notes
- Use App Router (not Pages Router)
- Implement API routes in `src/app/api/`
- Store components in `src/components/`
- Use `src/lib/` for utilities and database connections
- Implement proper type definitions in `src/types/`
