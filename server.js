/**
 * Servidor Express para rotas de email
 * Roda localmente na porta 3001
 */

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import statusChangeRoutes from './lib/emails/routes/statusChangeRoutes.js';
import priorityChangeRoutes from './lib/emails/routes/priorityChangeRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente do .env.local
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
const PORT = process.env.EMAIL_SERVER_PORT || 3001;

// ======================================================
// MIDDLEWARES
// ======================================================
app.use(helmet());
app.use(cors());

// Parser de JSON
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Log de requisições
app.use((req, res, next) => {
  console.log(`➔ ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ======================================================
// ROTAS
// ======================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'email-server'
  });
});

// Rotas de email
app.use(statusChangeRoutes);
app.use(priorityChangeRoutes);

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.url 
  });
});

// ======================================================
// MIDDLEWARE DE ERRO
// ======================================================
app.use((err, req, res, next) => {
  console.error('❌ Erro capturado:', err);
  res.status(500).json({ 
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================
app.listen(PORT, () => {
  console.log('\n=================================');
  console.log(`📧 Servidor de Email rodando na porta ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/emails/status-change`);
  console.log('=================================\n');
});