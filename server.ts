import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './backend/routes.ts';
import { db } from './backend/db.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body Parser with generous limit for CSV uploads
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // Mount backend REST APIs
  app.use('/api', apiRouter);

  // Serve sample datasets directly
  app.get('/api/dataset/sample.csv', (_req, res) => {
    const filePath = path.join(__dirname, 'dataset', 'sample_transactions.csv');
    res.download(filePath, 'sample_transactions.csv');
  });

  app.get('/api/dataset/corrupt_sample.csv', (_req, res) => {
    const filePath = path.join(__dirname, 'dataset', 'corrupt_sample_for_etl_test.csv');
    res.download(filePath, 'corrupt_sample_for_etl_test.csv');
  });

  // Healthcheck endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      system: 'FinGuard Financial Transaction Analysis & Fraud Detection System',
      recordsInDb: db.getAllTransactions().length,
      timestamp: new Date().toISOString(),
    });
  });

  // In development, hook Vite's dev server middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the built static SPA
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FinGuard Server] Online and listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[FinGuard Server] Startup error:', err);
  process.exit(1);
});
