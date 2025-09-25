### Neon MCP in Cursor: Quick Setup

**Goal**: Enable Cursor to talk to Neon Postgres via the Neon MCP Remote Server.

### 1) Cursor MCP config
Create `.cursor/mcp.json` (already added):

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/mcp"]
    }
  }
}
```

To use SSE instead of streamable HTTP responses:

```json
{
  "mcpServers": {
    "Neon": {
      "command": "npx",
      "args": ["-y", "mcp-remote@latest", "https://mcp.neon.tech/sse"]
    }
  }
}
```

Restart Cursor if not auto-detected. On first use, authorize via the OAuth window.

### 2) Connect Prisma to Neon
In `env` (or `.env.local`), set `DATABASE_URL` to your Neon connection string:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST/db?sslmode=require"
```

Prisma reads this in `prisma/schema.prisma` via `env("DATABASE_URL")`.

Common commands:

```bash
npx prisma generate
npx prisma migrate deploy
# or during development
npx prisma migrate dev
```

### 3) Notes
- By default, authentication uses your personal Neon account. To target an organization, use API key-based auth per Neon docs.
- If you switch to SSE, behavior is the same but uses server-sent events.
- Ensure `sslmode=require` for Neon.

### 4) Troubleshooting
- If Cursor doesn’t show Neon tools, check `.cursor/mcp.json` formatting.
- If OAuth doesn’t appear, restart Cursor.
- If Prisma can’t connect, verify `DATABASE_URL`, org/project role access, and SSL.


