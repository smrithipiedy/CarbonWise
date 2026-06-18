import express, { Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import compression from 'compression';
import carbonRouter from './routes/carbon';
import { PORT, ENV, CORS_ORIGIN } from './config';
import { securityHeaders, requireJsonContentType } from './middleware/security';
import { resolveFrontendDistPath } from './utils/paths';

const app = express();

const corsOptions: cors.CorsOptions =
  ENV === 'production'
    ? CORS_ORIGIN
      ? { origin: CORS_ORIGIN.split(',').map((o) => o.trim()), credentials: false }
      : { origin: false }
    : { origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: false };

app.use(securityHeaders);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use('/api', requireJsonContentType, carbonRouter);

const frontendDistPath = resolveFrontendDistPath();

if (fs.existsSync(frontendDistPath)) {
  console.log(`🟢 Mounting production static files from: ${frontendDistPath}`);

  app.use(express.static(frontendDistPath));

  app.get('*', (req: Request, res: Response) => {
    if (req.path.startsWith('/api')) {
      res.status(404).json({ error: 'Not found' });
      return;
    }

    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('React SPA built files are not found.');
    }
  });
} else {
  console.log('🟢 Running in API-only mode (frontend built assets not found)');
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Carbon Footprint Awareness Platform API',
      status: 'healthy',
      message: 'Running in API-only mode. Compile client to serve the full app.',
    });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  const isProductionReady = fs.existsSync(frontendDistPath);
  if (isProductionReady) {
    console.log(`🚀 CarbonWise Platform is running on http://localhost:${PORT}`);
  } else {
    console.log(`🚀 CarbonWise API is running on http://localhost:${PORT}`);
    console.log('💡 Dev Tip: Run "npm run dev" in the frontend directory and open the Vite local port for hot-reloading.');
  }
});
