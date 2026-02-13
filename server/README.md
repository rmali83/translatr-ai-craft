# Translation Server

Backend API server for the LinguaFlow translation application with Supabase integration.

## Tech Stack

- Node.js
- Express
- TypeScript
- Supabase
- Axios
- CORS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

3. Set up database:
   - Go to your Supabase project SQL Editor
   - Run the SQL script from `database/schema.sql`

4. Run development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
npm start
```

## API Endpoints

### Health Check
- **GET** `/health` - Returns server status

### Translation
- **POST** `/api/translate` - Translate text
  - Body: `{ text, sourceLang?, targetLang }`
- **POST** `/api/translate/detect` - Detect language
  - Body: `{ text }`

### Projects
- **GET** `/api/projects` - Get all projects
- **GET** `/api/projects/:id` - Get single project
- **POST** `/api/projects` - Create project
  - Body: `{ name, source_language, target_language, status? }`
- **PUT** `/api/projects/:id` - Update project
- **DELETE** `/api/projects/:id` - Delete project

### Segments
- **GET** `/api/segments?project_id=xxx` - Get segments by project
- **GET** `/api/segments/:id` - Get single segment
- **POST** `/api/segments` - Create segment
  - Body: `{ project_id, source_text, target_text?, status? }`
- **PUT** `/api/segments/:id` - Update segment
- **DELETE** `/api/segments/:id` - Delete segment

### Translation Memory
- **GET** `/api/tm?source_lang=&target_lang=&search=` - Get TM entries
- **GET** `/api/tm/search?text=&source_lang=&target_lang=` - Search TM
- **POST** `/api/tm` - Add TM entry
  - Body: `{ source_text, target_text, source_lang, target_lang }`
- **DELETE** `/api/tm/:id` - Delete TM entry

### Glossary
- **GET** `/api/glossary?language_pair=&search=` - Get glossary terms
- **GET** `/api/glossary/:id` - Get single term
- **POST** `/api/glossary` - Create term
  - Body: `{ source_term, target_term, language_pair, description? }`
- **PUT** `/api/glossary/:id` - Update term
- **DELETE** `/api/glossary/:id` - Delete term

## Database Schema

### Tables
- `projects` - Translation projects
- `segments` - Text segments within projects
- `translation_memory` - Translation memory entries
- `glossary_terms` - Glossary terminology

See `database/schema.sql` for complete schema.

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key

## Development

The server runs on `http://localhost:5000` by default.

Use `npm run dev` for hot-reloading during development.
