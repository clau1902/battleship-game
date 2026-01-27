# Battleship Game

Online multiplayer Battleship game with real-time updates.

## Tech Stack

Next.js 15, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, shadcn/ui, SSE

## Quick Setup

```bash
# Install dependencies
bun install

# Start PostgreSQL (Docker)
bash scripts/docker-setup.sh

# Configure .env.local
DATABASE_URL=postgresql://battleship:battleship123@localhost:5434/battleship
BETTER_AUTH_SECRET=your-secret-key-change-in-production-min-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Push database schema
bun run db:push

# Start dev server
bun run dev
```

Open http://localhost:3000

## How to Play

1. **Sign up/in** with email and password
2. **Find or create a game** from the setup screen
3. **Place 5 ships** on your board (Carrier, Battleship, Cruiser, Submarine, Destroyer)
4. **Battle** - take turns attacking the opponent's board
5. **Win** by sinking all opponent ships first

## Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server |
| `bun run build` | Build for production |
| `bun run db:push` | Push schema to database |
| `bun run db:studio` | Open Drizzle Studio |

## License

MIT
