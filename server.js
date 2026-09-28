/**
 * @fileoverview Production Express Server for SceneMemory GCP Cloud Run & Docker.
 * Listens on process.env.PORT || 8080.
 * Serves static dist assets, exposes GET /healthz (200 OK), returns 404 for missing assets,
 * and sets Permissions-Policy header for Mac camera access.
 *
 * @server server.js
 * @project Spatial Proof Lab / SceneMemory
 * @author Reece Challinor
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = __dirname;
const distDir = path.join(rootDir, 'dist');

const app = express();
const PORT = process.env.PORT || 8080;

// Security & Camera Headers
app.use((req, res, next) => {
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'scenememory',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime())
  });
});

// Serve compiled static assets
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir, { fallthrough: true }));
}

// Return 404 for missing asset/model routes instead of falling back to SPA HTML
app.use('/assets/*', (req, res) => res.status(404).send('Asset Not Found'));
app.use('/models/*', (req, res) => res.status(404).send('Model File Not Found'));

// SPA Fallback for navigation routes
app.get('*', (req, res) => {
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(503).send('Application build in progress or dist/ missing. Run npm run build first.');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`====================================================`);
  console.log(`SceneMemory Production Server running on 0.0.0.0:${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/healthz`);
  console.log(`====================================================`);
});
