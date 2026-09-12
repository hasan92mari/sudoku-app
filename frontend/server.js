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

app.use(express.json());

const frontendRedis = createClient({ url: FRONTEND_REDIS_URL });
frontendRedis.on('error', (error) => console.error('Frontend Redis error:', error));

const checkRedis = async () => {
  try {
    if (!frontendRedis.isOpen) {
      await frontendRedis.connect();
    }
    return true;
  } catch {
    return false;
  }
};

app.use('/api', async (req, res) => {
  try {
    const backendUrl = new URL(req.originalUrl, BACKEND_BASE_URL);
    const method = req.method || 'GET';

    const headers = {};
    if (req.headers.accept) {
      headers.accept = req.headers.accept;
    }
    if (req.headers['content-type']) {
      headers['content-type'] = req.headers['content-type'];
    }

    const backendResponse = await fetch(backendUrl, {
      method,
      headers,
      body: ['GET', 'HEAD'].includes(method) ? undefined : JSON.stringify(req.body ?? {})
    });

    const responseText = await backendResponse.text();
    const contentType = backendResponse.headers.get('content-type');

    if (contentType) {
      res.setHeader('content-type', contentType);
    }

    res.status(backendResponse.status).send(responseText);
  } catch (error) {
    console.error('API proxy error:', error);
    res.status(502).json({
      error: 'Failed to reach backend service'
    });
  }
});

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

app.listen(PORT, () => {
  console.log(`Frontend server is running on port ${PORT}`);
});
