# Battleship Game

An online Battleship game built with Next.js, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, and shadcn/ui.

## Features

- **User Authentication**: Sign up and sign in with email/password using Better Auth
- **Real-time Multiplayer**: Play battleship against other players with real-time updates
- **Screen Flow**: Intuitive game flow (Auth -> Setup -> Place Ships -> Battle -> Results)
- **Beautiful UI**: Modern interface with shadcn/ui and Tailwind CSS
- **Game Persistence**: PostgreSQL with Drizzle ORM for game state persistence
- **Hidden Ships**: Ships are hidden from opponents - only hits/misses are visible
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Long polling and WebSocket support for live game updates
- **URL-based Games**: Share game links with query parameters for easy joining

## Prerequisites

- Bun (JavaScript runtime)
- Docker and Docker Compose (for PostgreSQL) OR PostgreSQL running locally

## Setup

### Option 1: Using Docker (Recommended)

1. **Install dependencies:**
```bash
bun install
```

2. **Start PostgreSQL container:**
```bash
bash scripts/docker-setup.sh
```

This will:
- Create a Docker container with PostgreSQL
- Set up the database and user
- Create `.env.local` with the correct connection string

3. **Configure environment variables:**

Add the following to your `.env.local`:
```bash
DATABASE_URL=postgresql://battleship:battleship123@localhost:5434/battleship

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-change-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

4. **Run migrations:**
```bash
bun run db:push
```

5. **Start the development server:**
```bash
bun run dev
```

### Option 2: Using Local PostgreSQL

1. **Install dependencies:**
```bash
bun install
```

2. **Create a `.env.local` file** in the root directory:
```bash
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/battleship

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-change-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000
```

3. **Create the PostgreSQL database:**
```bash
createdb battleship
```

4. **Run Drizzle migrations** to create the schema:
```bash
bun run db:push
```

5. **Run the development server:**
```bash
bun run dev
```

This will start:
- Next.js server on http://localhost:3000
- WebSocket server on ws://localhost:3001

6. **Open [http://localhost:3000](http://localhost:3000)** in your browser.

## Database Commands

- `bun run db:push` - Push schema directly to database (development)
- `bun run db:generate` - Generate migration files from schema
- `bun run db:migrate` - Run pending migrations
- `bun run db:studio` - Open Drizzle Studio (database GUI)
- `bun run db:test` - Test database connection
- `bun run db:setup` - Automated database setup script

## Docker Commands

- `docker compose up -d` - Start PostgreSQL container
- `docker compose down` - Stop PostgreSQL container
- `docker compose logs -f postgres` - View PostgreSQL logs
- `bash scripts/docker-setup.sh` - Complete Docker setup

## How to Play

### 1. Sign Up / Sign In
- Create an account with your email and password
- Or sign in if you already have an account

### 2. Game Setup
After signing in, you'll see the setup screen with three options:
- **Find Match**: Automatically finds an opponent or creates a new game
- **Create Private Game**: Get a game ID to share with a friend
- **Join by ID**: Enter a game ID to join an existing game

### 3. Place Ships
- Select a ship type from the list
- Choose horizontal or vertical orientation
- Click on your board to place the ship
- Place all 5 ships:
  - Carrier (5 cells)
  - Battleship (4 cells)
  - Cruiser (3 cells)
  - Submarine (3 cells)
  - Destroyer (2 cells)

### 4. Battle
- Once both players have placed their ships, the battle begins
- Take turns clicking on the opponent's board to attack
- Red cells indicate hits, gray cells indicate misses
- The game updates in real-time when your opponent makes a move

### 5. Victory
- Sink all of your opponent's ships to win!
- After the game ends, click "Play Again" to start a new game

## Game Rules

- Each player has a 10x10 grid
- Players take turns attacking cells on the opponent's board
- Ships cannot overlap or be placed outside the board
- A hit is marked in red, a miss in gray
- When all cells of a ship are hit, the ship is sunk
- The first player to sink all opponent ships wins

## Screen Flow

```
Auth Screen -> Setup Screen -> Placing Screen -> Battle Screen -> Results Screen
     |              |                                                    |
     |              +----------------------------------------------------+
     |                                    (Play Again)
     +<--------------------- (Sign Out from any screen)
```

## Tech Stack

- **Framework**: Next.js 15
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better Auth
- **Runtime**: Bun
- **Real-time**: WebSocket + Long Polling

## Project Structure

```
battleship-game/
├── app/
│   ├── api/
│   │   ├── auth/           # Better Auth API routes
│   │   └── games/          # Game API routes
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Main game page with screen management
├── components/
│   ├── screens/            # Screen components
│   │   ├── auth-screen.tsx
│   │   ├── setup-screen.tsx
│   │   ├── placing-screen.tsx
│   │   ├── battle-screen.tsx
│   │   └── results-screen.tsx
│   ├── ui/                 # shadcn/ui components
│   └── game-board.tsx      # Game board component
├── db/
│   └── schema.ts           # Drizzle database schema (games + auth tables)
├── drizzle/                # Generated migration files
├── lib/
│   ├── auth.ts             # Better Auth server configuration
│   ├── auth-client.ts      # Better Auth client configuration
│   ├── game-logic.ts       # Game logic and rules
│   ├── db.ts               # Database connection
│   └── utils.ts            # Utility functions
└── types/
    └── game.ts             # TypeScript types
```

## Troubleshooting

### Authentication Issues

If you get "relation 'user' does not exist":
```bash
bun run db:push
```

This creates the auth tables (user, session, account, verification) in your database.

### Database Connection Errors

1. **Check PostgreSQL is running:**
   ```bash
   pg_isready
   ```

2. **Test your connection:**
   ```bash
   bun run db:test
   ```

3. **Verify your `.env.local` file** has the correct `DATABASE_URL` and `BETTER_AUTH_SECRET`

### Migration Issues

If migrations fail:

1. Make sure the database exists: `createdb battleship`
2. Check your connection string in `.env.local`
3. Try using `bun run db:push` for direct schema push (development only)

## Build

To build for production:

```bash
bun run build
```

To start the production server:

```bash
bun run start
```

## License

MIT
