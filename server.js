
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('username', username);
    
    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ username, password: hashedPassword })
      .select('id, username');
    
    if (insertError) {
      console.error('Insert user error:', insertError);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    if (!newUser || newUser.length === 0) {
      return res.status(500).json({ error: 'Failed to create user' });
    }
    
    const token = jwt.sign({ userId: newUser[0].id, username: newUser[0].username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: newUser[0].username, userId: newUser[0].id });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  try {
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, username, password')
      .eq('username', username);
    
    if (fetchError || !users || users.length === 0) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, username: user.username, userId: user.id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.sendStatus(401);
  }
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

app.post('/api/score', authenticateToken, async (req, res) => {
  const { score } = req.body;
  try {
    const { error } = await supabase
      .from('scores')
      .insert({ user_id: req.user.userId, score });
    
    if (error) {
      console.error('Save score error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Save score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/leaderboard', async (req, res) => {
  try {
    const { data: scores, error: scoresError } = await supabase
      .from('scores')
      .select('user_id, score')
      .order('score', { ascending: false })
      .limit(100);
    
    if (scoresError) {
      console.error('Leaderboard scores error:', scoresError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username');
    
    if (usersError) {
      console.error('Leaderboard users error:', usersError);
      return res.status(500).json({ error: 'Internal server error' });
    }

    const userMap = {};
    users.forEach(user => {
      userMap[user.id] = user.username;
    });

    const leaderboardMap = {};
    scores.forEach(scoreEntry => {
      const username = userMap[scoreEntry.user_id];
      if (username && (!leaderboardMap[username] || scoreEntry.score > leaderboardMap[username])) {
        leaderboardMap[username] = scoreEntry.score;
      }
    });

    const leaderboard = Object.entries(leaderboardMap)
      .map(([username, high_score]) => ({ username, high_score }))
      .sort((a, b) => b.high_score - a.high_score)
      .slice(0, 10);

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/user-scores', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('User scores error:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
    res.json(data || []);
  } catch (error) {
    console.error('User scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Connected to Supabase');
});

