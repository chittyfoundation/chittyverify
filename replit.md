# ChittyChain Evidence Ledger

## Overview

ChittyChain Evidence Ledger is a comprehensive legal evidence verification system that combines blockchain immutability with AI-powered analysis. The application serves as the verification layer within the ChittyOS ecosystem, providing court-admissible evidence management with cryptographic integrity and automated analysis capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Full-Stack Architecture
The application follows a modern full-stack architecture with clear separation between frontend, backend, and data layers:

- **Frontend**: React 18 with TypeScript, built using Vite for fast development and production builds
- **Backend**: Express.js server with TypeScript running in ESM mode
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **UI Framework**: Tailwind CSS with Radix UI components for consistent, accessible interfaces
- **Build System**: Vite for frontend bundling, esbuild for server bundling

### Development vs Production
The application is designed to run differently in development and production:
- Development uses Vite's dev server with hot module replacement
- Production serves static files from the built frontend
- Server-side rendering is handled through Vite's middleware in development

## Key Components

### Database Schema (Drizzle ORM)
The application uses a comprehensive 7-table schema designed for legal evidence management:

1. **Users**: Identity and trust score management
2. **Cases**: Legal case organization and metrics
3. **Evidence**: Core evidence artifacts with metadata
4. **Property Tax Records**: Specialized property tax documentation
5. **Payment History**: Financial transaction tracking
6. **Analysis Results**: AI-generated insights and findings
7. **Blockchain Transactions**: Immutable blockchain minting records

Each table includes proper foreign key relationships, timestamps, and JSONB fields for flexible metadata storage.

### Frontend Components
- **Dashboard**: Main interface showing case overview, evidence cards, and analytics
- **Evidence Management**: Upload, verification, and blockchain minting workflows
- **Property Tax Integration**: Specialized Cook County property tax scraping and verification
- **AI Analysis**: Integration with multiple AI systems for evidence analysis
- **Trust Scoring**: Dynamic trust calculation based on evidence quality and verification

### Backend API Structure
RESTful API endpoints organized by resource:
- `/api/cases` - Case management operations
- `/api/cases/:caseId/evidence` - Evidence operations within cases
- `/api/evidence/:id/analyze` - AI analysis triggers
- `/api/evidence/:id/mint` - Blockchain minting operations

### Storage Layer
Abstracted storage interface supporting multiple backends:
- In-memory storage for development/testing
- PostgreSQL with Drizzle ORM for production
- Support for user-owned Neon databases (individual instances per user)

## Data Flow

### Evidence Processing Pipeline
1. **Upload**: Files uploaded through web interface or API
2. **Validation**: Schema validation and file integrity checks
3. **Analysis**: AI-powered content analysis and fact extraction
4. **Verification**: Trust score calculation and human validation
5. **Minting**: Optional blockchain immutability (user consent required)

### User Data Ownership
- Each user gets their own Neon PostgreSQL database instance
- ChittyOS retains analysis and insights (work product)
- Blockchain minting only occurs with explicit user consent or for public records

### Integration Architecture
The system integrates with multiple external services:
- **Notion**: Collaborative case management
- **Google Drive**: Document synchronization
- **GitHub**: Version control for evidence
- **Property Tax Systems**: Cook County assessor/treasurer data
- **AI Services**: Claude, OpenAI for analysis
- **Blockchain**: Custom ChittyChain for immutable records

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI components
- **wouter**: Lightweight client-side routing

### Development Tools
- **vite**: Fast build tool and dev server
- **tsx**: TypeScript execution for server
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Type safety across the stack

### Specialized Integrations
- **connect-pg-simple**: PostgreSQL session storage
- **@hookform/resolvers**: Form validation
- **date-fns**: Date manipulation utilities
- **class-variance-authority**: Dynamic CSS class generation

## Deployment Strategy

### Development Environment
- Uses Replit's integrated development environment
- Vite dev server with HMR for frontend development
- TSX for server development with auto-restart
- Environment variables managed through Replit secrets

### Production Deployment
- Frontend built as static assets using Vite
- Server bundled with esbuild for Node.js deployment
- Database migrations managed through Drizzle Kit
- Supports deployment to various cloud platforms (Cloudflare Workers, traditional hosting)

### Database Strategy
- Development: Individual Neon databases per user
- Production: Scalable Neon PostgreSQL with connection pooling
- Schema versioning through Drizzle migrations
- Automatic schema synchronization via `db:push` command

The architecture emphasizes user data ownership, legal compliance, and scalable evidence management while maintaining type safety and development velocity.