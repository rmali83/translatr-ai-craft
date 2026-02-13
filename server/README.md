# Translation Server

Backend API server for the LinguaFlow translation application.

## Tech Stack

- Node.js
- Express
- TypeScript
- Axios
- CORS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` and add your API keys

3. Run development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/health`
- Returns server status

### Translation
- **POST** `/api/translate`
- Body: `{ text, sourceLang?, targetLang }`
- Returns translated text

### Language Detection
- **POST** `/api/translate/detect`
- Body: `{ text }`
- Returns detected language

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- Add AI service API keys as needed

## Development

The server runs on `http://localhost:5000` by default.

Use `npm run dev` for hot-reloading during development.
