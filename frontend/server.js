import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from 'redis';

const app = express();
const PORT = Number(process.env.PORT || 80);
const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://backend:5001';
const FRONTEND_REDIS_URL = process.env.FRONTEND_REDIS_URL || 'redis://localhost:6380';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendRedis = createClient({ url: FRONTEND_REDIS_URL });
frontendRedis.on('error', (error) => console.error('Frontend Redis error:', error));

const checkRedis = async () => {
  try {
    if (!frontendRedis.isOpen) {
      await frontendRedis.connect();
    }
    return true;
  } catch (error) {
    return false;
  }
};

const waitForReady = async () => {
  try {
    if (!frontendRedis.isOpen) {
      await frontendRedis.connect();
    }
    console.log('Frontend Redis connected successfully.');
  } catch (error) {
    console.error('Frontend Redis connection failed:', error);
  }
};

app.use(express.static(path.join(__dirname, 'dist')));

app.get('/health', async (req, res) => {
  res.status(200).json({ status: 'ok', service: 'frontend' });
});

app.get('/ready', async (req, res) => {
  try {
    const frontendRedisReady = await checkRedis();
    const backendReadyResponse = await fetch(`${BACKEND_BASE_URL}/api/ready`);
    const backendReady = backendReadyResponse.ok;

    if (!frontendRedisReady || !backendReady) {
      return res.status(503).json({
        status: 'not-ready',
        service: 'frontend',
        frontendRedis: frontendRedisReady ? 'connected' : 'disconnected',
        backend: backendReady ? 'connected' : 'disconnected'
      });
    }

    return res.status(200).json({
      status: 'ready',
      service: 'frontend',
      frontendRedis: 'connected',
      backend: 'connected'
    });
  } catch (error) {
    console.error('Frontend ready check error:', error);
    return res.status(503).json({
      status: 'not-ready',
      service: 'frontend',
      frontendRedis: 'unknown',
      backend: 'unknown'
    });
  }
});

app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

(async () => {
  await waitForReady();

  app.listen(PORT, () => {
    console.log(`Frontend server is running on port ${PORT}`);
  });
})();
