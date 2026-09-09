const express = require('express');
const cors = require('cors');
const { createClient } = require('redis');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 86400);
const SESSION_PREFIX = 'session:';
const BAN_PREFIX = 'ban:';
const LEADERBOARD_KEY = 'leaderboard';
const ADMIN_NAME = 'admin';

const client = createClient({
  url: REDIS_URL
});

client.on('error', (error) => {
  console.error('Redis Client Error:', error);
});

app.use(cors());
app.use(express.json());

const normalizeName = (value) => String(value || '').trim();
const sessionKey = (playerName) => `${SESSION_PREFIX}${normalizeName(playerName).toLowerCase()}`;
const banKey = (playerName) => `${BAN_PREFIX}${normalizeName(playerName).toLowerCase()}`;

const buildSessionPayload = ({ playerName }) => ({
  playerName,
  lastSeen: Date.now()
});

const buildBanPayload = ({ playerName, durationSeconds }) => ({
  playerName,
  durationSeconds,
  expiresAt: Date.now() + durationSeconds * 1000
});

const formatLeaderboardEntry = (entry) => {
  const [playerName] = entry.value.split(':');

  return {
    playerName,
    timeInSeconds: entry.score
  };
};

async function initRedis() {
  try {
    await client.connect();
    console.log('Successfully connected to Redis! 🚀');
  } catch (error) {
    console.error('Could not connect to Redis:', error);
  }
}

const checkRedisHealth = async () => {
  try {
    await client.ping();
    return true;
  } catch (error) {
    return false;
  }
};

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.get('/api/ready', async (req, res) => {
  try {
    const redisReady = await checkRedisHealth();

    if (!redisReady) {
      return res.status(503).json({ status: 'not-ready', service: 'backend', redis: 'disconnected' });
    }

    return res.status(200).json({ status: 'ready', service: 'backend', redis: 'connected' });
  } catch (error) {
    console.error('Backend ready check error:', error);
    return res.status(503).json({ status: 'not-ready', service: 'backend', redis: 'disconnected' });
  }
});

app.get('/heath', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'backend' });
});

app.get('/ready', async (req, res) => {
  try {
    const redisReady = await checkRedisHealth();

    if (!redisReady) {
      return res.status(503).json({ status: 'not-ready', service: 'backend', redis: 'disconnected' });
    }

    return res.status(200).json({ status: 'ready', service: 'backend', redis: 'connected' });
  } catch (error) {
    console.error('Backend ready alias error:', error);
    return res.status(503).json({ status: 'not-ready', service: 'backend', redis: 'disconnected' });
  }
});

app.get('/', (req, res) => {
  res.send('Sudoku Backend is running...');
});

app.post('/api/session/enter', async (req, res) => {
  try {
    const { playerName, language = 'en', theme = 'dark' } = req.body || {};
    const normalizedPlayerName = normalizeName(playerName);

    if (!normalizedPlayerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    if (normalizedPlayerName.toLowerCase() === ADMIN_NAME) {
      const payload = buildSessionPayload({
        playerName: normalizedPlayerName
      });

      await client.set(sessionKey(normalizedPlayerName), JSON.stringify(payload), {
        EX: SESSION_TTL_SECONDS
      });

      return res.status(200).json({
        success: true,
        isAdmin: true,
        playerName: normalizedPlayerName
      });
    }

    const existingBan = await client.get(banKey(normalizedPlayerName));

    if (existingBan) {
      const parsedBan = JSON.parse(existingBan);
      const remainingMs = parsedBan.expiresAt - Date.now();

      if (remainingMs > 0) {
        return res.status(200).json({
          success: false,
          banned: true,
          playerName: normalizedPlayerName,
          banInfo: {
            playerName: normalizedPlayerName,
            remainingSeconds: Math.ceil(remainingMs / 1000),
            expiresAt: parsedBan.expiresAt
          }
        });
      }

      await client.del(banKey(normalizedPlayerName));
    }

    const payload = buildSessionPayload({
      playerName: normalizedPlayerName
    });

    await client.set(sessionKey(normalizedPlayerName), JSON.stringify(payload), {
      EX: SESSION_TTL_SECONDS
    });

    return res.status(200).json({
      success: true,
      banned: false,
      isAdmin: false,
      playerName: normalizedPlayerName
    });
  } catch (error) {
    console.error('Session creation error:', error);
    return res.status(500).json({ error: 'Failed to create session' });
  }
});

app.get('/api/session/:playerName', async (req, res) => {
  try {
    const { playerName } = req.params;
    const data = await client.get(sessionKey(playerName));

    if (!data) {
      return res.status(404).json({ message: 'No session found' });
    }

    return res.status(200).json(JSON.parse(data));
  } catch (error) {
    console.error('Session fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch session' });
  }
});

app.post('/api/save', async (req, res) => {
  try {
    const { userId, board } = req.body;
    await client.set(`user:${userId}:board`, JSON.stringify(board), {
      EX: SESSION_TTL_SECONDS
    });

    return res.status(200).json({ message: 'Game saved successfully!' });
  } catch (error) {
    console.error('Save game error:', error);
    return res.status(500).json({ error: 'Failed to save game' });
  }
});

app.get('/api/load/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await client.get(`user:${userId}:board`);

    if (data) {
      return res.status(200).json(JSON.parse(data));
    }

    return res.status(404).json({ message: 'No saved game found' });
  } catch (error) {
    console.error('Load game error:', error);
    return res.status(500).json({ error: 'Failed to load game' });
  }
});

app.post('/api/results', async (req, res) => {
  try {
    const { playerName, timeInSeconds } = req.body || {};
    const normalizedPlayerName = normalizeName(playerName);

    if (!normalizedPlayerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    const parsedScore = Number(timeInSeconds);

    if (!Number.isFinite(parsedScore) || parsedScore < 0) {
      return res.status(400).json({ error: 'Valid time in seconds is required' });
    }

    await client.zAdd(LEADERBOARD_KEY, {
      score: parsedScore,
      value: `${normalizedPlayerName}:${Date.now()}`
    });

    return res.status(200).json({ message: 'Score saved!' });
  } catch (error) {
    console.error('Save score error:', error);
    return res.status(500).json({ error: 'Failed to save score' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const results = await client.zRangeWithScores(LEADERBOARD_KEY, 0, 9);
    const formattedResults = results.map(formatLeaderboardEntry);

    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error('Fetch leaderboard error:', error);
    return res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

app.get('/api/admin/players', async (req, res) => {
  try {
    const banKeys = await client.keys(`${BAN_PREFIX}*`);
    const players = await Promise.all(
      banKeys.map(async (key) => {
        const data = await client.get(key);

        if (!data) {
          return null;
        }

        const parsedData = JSON.parse(data);
        const remainingMs = parsedData.expiresAt - Date.now();

        if (remainingMs <= 0) {
          await client.del(key);
          return null;
        }

        return {
          playerName: parsedData.playerName,
          remainingSeconds: Math.ceil(remainingMs / 1000),
          expiresAt: parsedData.expiresAt
        };
      })
    );

    return res.status(200).json(players.filter(Boolean));
  } catch (error) {
    console.error('Fetch admin bans error:', error);
    return res.status(500).json({ error: 'Failed to fetch bans' });
  }
});

app.post('/api/admin/ban', async (req, res) => {
  try {
    const { playerName, durationMinutes } = req.body || {};
    const normalizedPlayerName = normalizeName(playerName);
    const duration = Number(durationMinutes);

    if (!normalizedPlayerName) {
      return res.status(400).json({ error: 'Player name is required' });
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      return res.status(400).json({ error: 'Duration must be greater than zero' });
    }

    const durationSeconds = Math.max(1, Math.floor(duration * 60));
    const payload = buildBanPayload({
      playerName: normalizedPlayerName,
      durationSeconds
    });

    await client.set(banKey(normalizedPlayerName), JSON.stringify(payload), {
      EX: durationSeconds
    });

    return res.status(201).json({
      success: true,
      playerName: normalizedPlayerName,
      remainingSeconds: durationSeconds
    });
  } catch (error) {
    console.error('Create ban error:', error);
    return res.status(500).json({ error: 'Failed to create ban' });
  }
});

(async () => {
  app.listen(PORT, () => {
    console.log(`Server is breathing on port ${PORT}`);
  });

  await initRedis();
})();