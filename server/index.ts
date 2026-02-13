import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import translateRoutes from './routes/translate';
import projectsRoutes from './routes/projects';
import segmentsRoutes from './routes/segments';
import translationMemoryRoutes from './routes/translationMemory';
import glossaryRoutes from './routes/glossary';

// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/translate', translateRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/segments', segmentsRoutes);
app.use('/api/tm', translationMemoryRoutes);
app.use('/api/glossary', glossaryRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
