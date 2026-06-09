import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

// Load .env from root directory (for local development)
// In production (Vercel), environment variables are automatically injected
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');
const envPath = path.join(rootDir, '.env');

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
