
# Classic Snake Game with Leaderboard

A web-based classic snake game with user authentication, high score saving, and a leaderboard system. Ready for deployment with Supabase!

## Features

- User registration and login
- Classic snake gameplay
- High score saving per user (online with Supabase)
- Global leaderboard (top 10 scores)
- Responsive design
- Modern sleek achromatic theme
- Difficulty levels (Easy, Normal, Hard)

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js with Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Step-by-Step Implementation & Supabase Setup

### 1. Prerequisites

Make sure you have Node.js installed on your machine. You can download it from [nodejs.org](https://nodejs.org/).

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com/) and sign up / sign in.
2. Click "New Project" and create a new project.
3. Wait for your project to be ready (it takes a couple of minutes).

### 3. Create Database Tables in Supabase

Once your project is ready:

1. Go to the **SQL Editor** in your Supabase dashboard.
2. Create a new query and run the following SQL to create the users and scores tables:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

3. Click "Run" to execute the query.

### 4. Get Supabase Credentials

1. In your Supabase project dashboard, go to **Project Settings** → **API**.
2. Copy:
   - Your **Project URL** (starts with https://)
   - Your **anon public** key

### 5. Configure Environment Variables

1. Create a new file in the project root named `.env`
2. Copy the contents from `.env.example` into `.env`
3. Fill in your Supabase credentials and a secure JWT secret:

```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=your-very-secure-random-jwt-secret-key-change-this
PORT=3000
```

### 6. Install Dependencies

Open a terminal, navigate to the project directory, and run:

```bash
npm install
```

This will install all required packages: express, @supabase/supabase-js, bcryptjs, jsonwebtoken, cors, and dotenv.

### 7. Run the Application

Start the server by running:

```bash
npm start
```

The server will start running on port 3000.

### 8. Play the Game

Open your web browser and go to `http://localhost:3000`.

### 9. How to Play

- **Register or Login**: Create an account or log in with existing credentials.
- **Choose Difficulty**: Select Easy, Normal, or Hard.
- **Start Game**: Press any arrow key to start the game.
- **Controls**: Use arrow keys to move the snake.
- **Objective**: Eat the gray food to grow and increase your score.
- **Game Over**: If the snake hits the wall or itself, the game ends and your score is saved to Supabase.

## Deployment

### Option 1: Deploy to Render

1. Push your code to a GitHub repository.
2. Go to [render.com](https://render.com/) and sign up.
3. Create a new "Web Service" and connect your GitHub repository.
4. Set the following:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add the following **Environment Variables** in Render:
   - `SUPABASE_URL`: your-supabase-url
   - `SUPABASE_ANON_KEY`: your-supabase-anon-key
   - `JWT_SECRET`: your-jwt-secret
6. Click "Create Web Service".

### Option 2: Deploy to Vercel

Note: Vercel works best with serverless functions, but you can also deploy with a Node.js server.

1. Push your code to GitHub.
2. Go to [vercel.com](https://vercel.com/) and sign up.
3. Import your GitHub repository.
4. Add the environment variables in Vercel's project settings.
5. Deploy!

## Project Structure

```
Snake Game/
├── public/
│   ├── index.html    # Frontend HTML
│   ├── style.css     # Frontend styling
│   └── game.js       # Frontend logic and API integration
├── server.js         # Backend server with Supabase integration
├── package.json      # Project dependencies
├── .env.example      # Example environment variables
├── .env              # Your actual environment variables (don't commit this!)
└── README.md         # This file
```

## Important Note

Never commit your `.env` file to version control! It contains your secret keys.

## License

MIT
