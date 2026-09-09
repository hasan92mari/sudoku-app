import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
const STORAGE_KEY = 'sudoku-session';

const translations = {
  en: {
    appTitle: 'Sudoku Cloud App',
    welcome: 'Welcome',
    playerName: 'Player name',
    language: 'Language',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    enter: 'Enter',
    adminTitle: 'Admin Control',
    adminWelcome: 'Admin panel is ready.',
    bannedMessage: 'You are temporarily banned from playing.',
    remaining: 'Remaining',
    nameRequired: 'Please enter your name first.',
    leaderboardTitle: '🏆 Top Winners',
    startGame: 'Start Game',
    leaderboard: 'Leaderboard',
    back: 'Back',
    difficulty: 'Difficulty',
    easy: 'Easy',
    hard: 'Hard',
    submitResult: 'Submit Result',
    boardNotReady: 'Board is not ready or has errors.',
    scoreSaved: 'Your score was saved successfully.',
    buildFailed: 'Unable to connect to the backend right now.',
    adminPlayers: 'Player bans',
    banPlayer: 'Ban player',
    banDuration: 'Ban duration (minutes)',
    noBans: 'No active bans yet.',
    playerMissing: 'Please provide the player name.',
    durationMissing: 'Please enter a valid duration.',
    banAdded: 'Ban has been saved successfully.',
    openLeaderboard: 'Open leaderboard',
    checkAgain: 'Check again',
    bannedEnded: 'Your block time has ended. You can try again.',
    adminAccess: 'Use the name admin to open the admin panel.'
  },
  ar: {
    appTitle: 'تطبيق سودوكو السحابي',
    welcome: 'مرحبا',
    playerName: 'اسم اللاعب',
    language: 'اللغة',
    theme: 'المظهر',
    dark: 'داكن',
    light: 'فاتح',
    enter: 'دخول',
    adminTitle: 'لوحة الإدارة',
    adminWelcome: 'لوحة الإدارة جاهزة.',
    bannedMessage: 'أنت محظور مؤقتاً من اللعب.',
    remaining: 'المتبقي',
    nameRequired: 'يرجى إدخال اسمك أولاً.',
    leaderboardTitle: '🏆 أفضل النتائج',
    startGame: 'ابدأ اللعبة',
    leaderboard: 'المتصدرون',
    back: 'عودة',
    difficulty: 'الصعوبة',
    easy: 'سهل',
    hard: 'صعب',
    submitResult: 'إرسال النتيجة',
    boardNotReady: 'اللوحة غير مكتملة أو بها أخطاء.',
    scoreSaved: 'تم حفظ النتيجة بنجاح.',
    buildFailed: 'لا يمكن الاتصال بالخادم الآن.',
    adminPlayers: 'أسماء اللاعبين المحظورين',
    banPlayer: 'حظر لاعب',
    banDuration: 'مدة الحظر (دقائق)',
    noBans: 'لا توجد قيود حالياً.',
    playerMissing: 'يرجى إدخال اسم اللاعب.',
    durationMissing: 'يرجى إدخال مدة صالحة.',
    banAdded: 'تم حفظ الحظر بنجاح.',
    openLeaderboard: 'فتح لوحة المتصدرين',
    checkAgain: 'تحقق مرة أخرى',
    bannedEnded: 'انتهت مدة الحظر. يمكنك المحاولة مرة أخرى.',
    adminAccess: 'استخدم اسم admin لفتح لوحة الإدارة.'
  },
  de: {
    appTitle: 'Sudoku Cloud App',
    welcome: 'Willkommen',
    playerName: 'Spielername',
    language: 'Sprache',
    theme: 'Design',
    dark: 'Dunkel',
    light: 'Hell',
    enter: 'Starten',
    adminTitle: 'Admin-Bereich',
    adminWelcome: 'Das Admin-Panel ist bereit.',
    bannedMessage: 'Du bist vorübergehend vom Spielen gesperrt.',
    remaining: 'Verbleibend',
    nameRequired: 'Bitte gib zuerst deinen Namen ein.',
    leaderboardTitle: '🏆 Beste Ergebnisse',
    startGame: 'Spiel starten',
    leaderboard: 'Bestenliste',
    back: 'Zurück',
    difficulty: 'Schwierigkeit',
    easy: 'Einfach',
    hard: 'Schwer',
    submitResult: 'Ergebnis senden',
    boardNotReady: 'Das Brett ist noch nicht fertig oder enthält Fehler.',
    scoreSaved: 'Dein Ergebnis wurde erfolgreich gespeichert.',
    buildFailed: 'Der Backend-Server ist derzeit nicht erreichbar.',
    adminPlayers: 'Gesperrte Spieler',
    banPlayer: 'Spieler sperren',
    banDuration: 'Sperrdauer (Minuten)',
    noBans: 'Noch keine aktiven Sperren.',
    playerMissing: 'Bitte gib den Spielernamen an.',
    durationMissing: 'Bitte eine gültige Dauer eingeben.',
    banAdded: 'Die Sperre wurde erfolgreich gespeichert.',
    openLeaderboard: 'Bestenliste öffnen',
    checkAgain: 'Erneut prüfen',
    bannedEnded: 'Deine Sperrzeit ist abgelaufen. Du kannst es erneut versuchen.',
    adminAccess: 'Nutze den Namen admin, um das Admin-Panel zu öffnen.'
  }
};

const createEmptyGrid = () =>
  Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ value: 0, isOriginal: false }))
  );

const isSafe = (board, row, col, num) => {
  if (num === 0) return true;

  for (let i = 0; i < 9; i += 1) {
    if ((board[row][i].value === num && i !== col) || (board[i][col].value === num && i !== row)) {
      return false;
    }
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let r = 0; r < 3; r += 1) {
    for (let c = 0; c < 3; c += 1) {
      const targetRow = startRow + r;
      const targetCol = startCol + c;

      if (
        board[targetRow][targetCol].value === num &&
        (targetRow !== row || targetCol !== col)
      ) {
        return false;
      }
    }
  }

  return true;
};

const isBoardComplete = (gridToCheck) => {
  for (let row = 0; row < 9; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      if (gridToCheck[row][col].value === 0 || !isSafe(gridToCheck, row, col, gridToCheck[row][col].value)) {
        return false;
      }
    }
  }

  return true;
};

const formatTime = (seconds) => {
  const totalMinutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(totalMinutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

function App() {
  const [playerName, setPlayerName] = useState('');
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('dark');
  const [difficulty, setDifficulty] = useState('Easy');
  const [screen, setScreen] = useState('setup');
  const [grid, setGrid] = useState(createEmptyGrid());
  const [seconds, setSeconds] = useState(0);
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const [banInfo, setBanInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [adminPlayers, setAdminPlayers] = useState([]);
  const [banForm, setBanForm] = useState({ playerName: '', durationMinutes: '30' });

  const t = translations[language] ?? translations.en;

  useEffect(() => {
    const savedSession = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');

    if (savedSession.playerName) {
      setPlayerName(savedSession.playerName);
    }

    if (savedSession.language) {
      setLanguage(savedSession.language);
    }

    if (savedSession.theme) {
      setTheme(savedSession.theme);
    }

    fetchLeaderboardData();
  }, []);

  useEffect(() => {
    document.title = t.appTitle;
    document.body.dataset.theme = theme;
  }, [theme, t.appTitle]);

  useEffect(() => {
    if (screen !== 'banned' || !banInfo) return undefined;

    const timer = setInterval(() => {
      setBanInfo((current) => {
        if (!current) return null;

        const nextSeconds = Math.max(0, current.remainingSeconds - 1);

        if (nextSeconds === 0) {
          setScreen('setup');
          setMessage(t.bannedEnded);
          return null;
        }

        return { ...current, remainingSeconds: nextSeconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, banInfo, t.bannedEnded]);

  useEffect(() => {
    if (screen !== 'game' || !isGameStarted) return undefined;

    const timer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, isGameStarted]);

  const saveSessionLocally = (sessionData) => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
  };

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/leaderboard`);
      setLeaderboard(response.data || []);
    } catch (error) {
      console.error('Fetch leaderboard error:', error);
    }
  };

  const fetchAdminPlayers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/players`);
      setAdminPlayers(response.data || []);
    } catch (error) {
      console.error('Fetch admin players error:', error);
    }
  };

  const buildGameBoard = (selectedDifficulty = difficulty) => {
    const baseGrid = [
      [1, 2, 3, 4, 5, 6, 7, 8, 9],
      [4, 5, 6, 7, 8, 9, 1, 2, 3],
      [7, 8, 9, 1, 2, 3, 4, 5, 6],
      [2, 3, 1, 5, 6, 4, 8, 9, 7],
      [5, 6, 4, 8, 9, 7, 2, 3, 1],
      [8, 9, 7, 2, 3, 1, 5, 6, 4],
      [3, 1, 2, 6, 4, 5, 9, 7, 8],
      [6, 4, 5, 9, 7, 8, 3, 1, 2],
      [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ];

    const shuffleBoard = (gridValues) => {
      const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      return gridValues.map((row) => row.map((value) => numbers[value - 1]));
    };

    const shuffledGrid = shuffleBoard(baseGrid);
    const solvedGrid = shuffledGrid.map((row) => row.map((value) => ({ value, isOriginal: true })));

    const hideLimit = selectedDifficulty === 'Easy' ? 35 : 55;
    let hidden = 0;

    while (hidden < hideLimit) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);

      if (solvedGrid[row][col].isOriginal) {
        solvedGrid[row][col] = { value: 0, isOriginal: false };
        hidden += 1;
      }
    }

    setGrid(solvedGrid);
    setSeconds(0);
    setIsGameStarted(true);
    setScreen('game');
  };

  const handleCellChange = (event, row, col) => {
    if (!isGameStarted || grid[row][col].isOriginal) return;

    const value = event.target.value;
    const lastDigit = value.slice(-1);
    const numericValue = lastDigit >= '1' && lastDigit <= '9' ? Number(lastDigit) : 0;

    const updatedGrid = grid.map((currentRow) => [...currentRow]);
    updatedGrid[row][col] = { ...updatedGrid[row][col], value: numericValue };
    setGrid(updatedGrid);
  };

  const enterApp = async () => {
    const trimmedName = playerName.trim();

    if (!trimmedName) {
      setMessage(t.nameRequired);
      return;
    }

    const sessionData = { playerName: trimmedName, language, theme };
    saveSessionLocally(sessionData);

    try {
      const response = await axios.post(`${API_BASE_URL}/session/enter`, sessionData);

      if (trimmedName.toLowerCase() === 'admin') {
        setMessage(t.adminWelcome);
        setScreen('admin');
        await fetchAdminPlayers();
        return;
      }

      if (response.data?.banned) {
        setBanInfo(response.data.banInfo || null);
        setScreen('banned');
        setMessage(t.bannedMessage);
        return;
      }

      buildGameBoard();
      setMessage('');
    } catch (error) {
      console.error('Session creation error:', error);
      setMessage(t.buildFailed);
    }
  };

  const submitScore = async () => {
    if (!isBoardComplete(grid)) {
      setMessage(t.boardNotReady);
      return;
    }

    setIsGameStarted(false);

    try {
      await axios.post(`${API_BASE_URL}/results`, {
        playerName,
        timeInSeconds: seconds
      });

      setMessage(t.scoreSaved);
      setScreen('leaderboard');
      await fetchLeaderboardData();
    } catch (error) {
      console.error('Submit score error:', error);
      setMessage(t.buildFailed);
    }
  };

  const handleBanSubmission = async () => {
    const trimmedPlayer = banForm.playerName.trim();
    const duration = Number(banForm.durationMinutes);

    if (!trimmedPlayer) {
      setMessage(t.playerMissing);
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setMessage(t.durationMissing);
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/admin/ban`, {
        playerName: trimmedPlayer,
        durationMinutes: duration
      });

      setMessage(t.banAdded);
      setBanForm({ playerName: '', durationMinutes: '30' });
      await fetchAdminPlayers();
    } catch (error) {
      console.error('Ban creation error:', error);
      setMessage(t.buildFailed);
    }
  };

  const showLeaderboard = async () => {
    await fetchLeaderboardData();
    setScreen('leaderboard');
  };

  const openSetup = () => {
    setScreen('setup');
    setMessage('');
    setBanInfo(null);
    setIsGameStarted(false);
  };

  const renderLeaderboard = () => (
    <div className="panel-card leaderboard-view">
      <h2>{t.leaderboardTitle}</h2>
      <div className="score-list">
        {leaderboard.length === 0 ? (
          <div className="empty-state">{t.noBans}</div>
        ) : (
          leaderboard.map((entry, index) => (
            <div key={`${entry.playerName}-${index}`} className="score-item">
              <span>#{index + 1} {entry.playerName}</span>
              <span>{entry.timeInSeconds}s</span>
            </div>
          ))
        )}
      </div>
      <button className="btn secondary" onClick={openSetup}>{t.back}</button>
    </div>
  );

  return (
    <div className="app-shell">
      <div className="container">
        <header className="top-bar">
          <h1>{t.appTitle}</h1>
          <div className="header-actions">
            <select value={language} onChange={(event) => setLanguage(event.target.value)}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
              <option value="de">Deutsch</option>
            </select>
            <select value={theme} onChange={(event) => setTheme(event.target.value)}>
              <option value="dark">{t.dark}</option>
              <option value="light">{t.light}</option>
            </select>
          </div>
        </header>

        {screen === 'setup' && (
          <div className="setup-card panel-card">
            <h2>{t.welcome}</h2>
            <p className="helper-text">{t.adminAccess}</p>
            <input
              className="name-input"
              placeholder={t.playerName}
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
            />

            <div className="field-group">
              <label>{t.difficulty}</label>
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option value="Easy">{t.easy}</option>
                <option value="Hard">{t.hard}</option>
              </select>
            </div>

            <div className="button-row">
              <button className="btn start-btn" onClick={enterApp}>{t.enter}</button>
              <button className="btn secondary" onClick={showLeaderboard}>{t.leaderboard}</button>
            </div>
          </div>
        )}

        {screen === 'game' && (
          <div className="game-area">
            <div className="status-bar">
              <span>{playerName} | {difficulty}</span>
              <span className="timer">{formatTime(seconds)}</span>
            </div>

            <div className="sudoku-grid">
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const valid = isSafe(grid, rowIndex, colIndex, cell.value);
                  const cellClass = cell.isOriginal
                    ? 'original'
                    : cell.value !== 0
                      ? valid
                        ? 'correct'
                        : 'incorrect'
                      : '';

                  return (
                    <input
                      key={`${rowIndex}-${colIndex}`}
                      type="tel"
                      inputMode="numeric"
                      className={`cell ${cellClass} ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'row-boundary' : ''}`}
                      value={cell.value === 0 ? '' : cell.value}
                      onChange={(event) => handleCellChange(event, rowIndex, colIndex)}
                      disabled={cell.isOriginal}
                    />
                  );
                })
              )}
            </div>

            <button className="btn finish-btn" onClick={submitScore}>{t.submitResult}</button>
          </div>
        )}

        {screen === 'leaderboard' && renderLeaderboard()}

        {screen === 'admin' && (
          <div className="panel-card admin-view">
            <h2>{t.adminTitle}</h2>

            <div className="admin-form">
              <input
                className="name-input"
                placeholder={t.playerName}
                value={banForm.playerName}
                onChange={(event) => setBanForm({ ...banForm, playerName: event.target.value })}
              />
              <input
                className="name-input"
                type="number"
                min="1"
                placeholder={t.banDuration}
                value={banForm.durationMinutes}
                onChange={(event) => setBanForm({ ...banForm, durationMinutes: event.target.value })}
              />
              <button className="btn start-btn" onClick={handleBanSubmission}>{t.banPlayer}</button>
              <button className="btn secondary" onClick={openSetup}>{t.back}</button>
            </div>

            <div className="admin-list">
              <h3>{t.adminPlayers}</h3>
              {adminPlayers.length === 0 ? (
                <div className="empty-state">{t.noBans}</div>
              ) : (
                adminPlayers.map((player) => (
                  <div key={player.playerName} className="score-item">
                    <span>{player.playerName}</span>
                    <span>{player.remainingSeconds}s</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {screen === 'banned' && (
          <div className="panel-card banned-view">
            <h2>{t.bannedMessage}</h2>
            <p>{t.remaining}: {formatTime(banInfo?.remainingSeconds || 0)}</p>
            <button className="btn secondary" onClick={openSetup}>{t.checkAgain}</button>
          </div>
        )}

        {message && <div className="toast-message">{message}</div>}
      </div>
    </div>
  );
}

export default App;