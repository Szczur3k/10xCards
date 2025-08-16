# 10xCards

## Project Description

10xCards is a web application designed for creating and managing educational flashcards. It enables LLM flashcard generation from input text and supports manual creation, editing, deletion, and viewing of flashcards. The app integrates flashcards with a spaced repetition algorithm to enhance learning efficiency. Additional features include user authentication, real-time statistics, and timely caching of AI-generated results.

## Tech Stack

- **Frontend:** Astro 5, React 19, TypeScript 5, Tailwind CSS 4, Shadcn/ui (dark mode ready)
- **Backend:** Supabase (PostgreSQL), API endpoints for flashcards management, JWT authentication, CSRF protection
- **AI Integration:** Openrouter.ai for AI-powered flashcard generation
- **CI/CD & Hosting:** GitHub Actions, DigitalOcean
- **Other:** Node.js version 22.14.0 (as per `.nvmrc`)

## Getting Started Locally

1. **Clone the repository:**
   ```powershell
   git clone <repository-url>
   cd <repository-directory>
   ```
2. **Install dependencies:**
   ```powershell
   npm install
   ```
3. **Set Node.js version:**
   Ensure you are using Node.js `22.14.0` by running:
   ```powershell
   nvm use 22.14.0
   ```
4. **Run the development server:**
   ```powershell
   npm run dev
   ```
5. **Access the app:** Open your browser and navigate to `http://localhost:3000`

## Available Scripts

- `npm run dev` - Starts the Astro development server
- `npm run build` - Builds the project for production
- `npm run preview` - Preview the production build locally
- `npm run astro` - Invoke Astro CLI directly
- `npm run lint` - Run ESLint on the project
- `npm run lint:fix` - Automatically fix ESLint issues
- `npm run format` - Format the codebase using Prettier

## Testing Technologies

### Unit & Component Testing

- **Vitest** - Fast unit testing framework for Vite-based projects
- **React Testing Library** - Testing utilities for React components focusing on user behavior

### End-to-End & Integration Testing

- **Playwright** - Cross-browser testing framework for E2E and API testing
- **Cypress** - Alternative E2E testing solution (optional)

### API Testing

- **Postman/Insomnia** - Manual API testing and documentation
- **Supertest** - HTTP assertion library for testing API endpoints

### Performance Testing

- **k6** - Load testing and performance monitoring
- **Playwright Tracing** - Performance analysis and debugging

## Project Scope

- **AI Flashcard Generation:** Generate flashcards using AI with character limits (front: 200, back: 500). Maximum generation time of 2 seconds per flashcard.
- **Manual Flashcard Management:** Create, edit, and delete flashcards manually.
- **User Authentication:** Registration, login, password reset, and account deletion using JWT and CSRF safeguards.
- **Statistical Dashboard:** Display generation metrics (time, token usage, acceptance rate) using Chart.js.
- **API Endpoints:**
  - `POST /api/flashcards/generate`
  - `PUT /api/flashcards/edit`
  - `DELETE /api/flashcards/delete`
  - `GET /api/flashcards/review`
  - `POST /api/flashcards/add`

## Project Status

This project is currently in its Minimum Viable Product (MVP) stage. Core functionalities are implemented, with ongoing improvements and optimizations.

## License

This project is licensed under the MIT License.
