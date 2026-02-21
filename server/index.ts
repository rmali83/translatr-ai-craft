import express, { Application, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { authenticate as rbacAuthenticate, hasRole, hasProjectRole } from './middleware/rbac';
import { authenticateUser } from './middleware/auth';
import { socketService } from './services/socketService';
import authRoutes from './routes/auth';
import translateRoutes from './routes/translate';
import projectsRoutes from './routes/projects';
import segmentsRoutes from './routes/segments';
import translationMemoryRoutes from './routes/translationMemory';
import glossaryRoutes from './routes/glossary';
import workflowRoutes from './routes/workflow';

// Load environment variables
dotenv.config();

const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
socketService.initialize(httpServer);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route (no auth required)
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (some require auth, some don't)
app.use('/api/auth', authRoutes);

// Public routes (no auth required for now, but can be protected)
app.use('/api/translate', translateRoutes);
app.use('/api/tm', translationMemoryRoutes);
app.use('/api/glossary', glossaryRoutes);

// Protected routes - require Supabase authentication (with RBAC fallback)
const authenticate = process.env.USE_SUPABASE_AUTH === 'true' ? authenticateUser : rbacAuthenticate;
app.use('/api/projects', authenticate, projectsRoutes);
app.use('/api/segments', authenticate, segmentsRoutes);
app.use('/api/workflow', authenticate, workflowRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
  });
});

// Start server
const HOST = process.env.HOST || '0.0.0.0';
httpServer.listen(Number(PORT), HOST, () => {
  console.log(`🚀 Server is running on ${HOST}:${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 Auth mode: ${process.env.USE_SUPABASE_AUTH === 'true' ? 'Supabase JWT' : 'RBAC (x-user-id)'}`);
  console.log(`🔌 WebSocket server initialized`);
});

export default app;

