import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this file
const __dirname = dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
// This file is imported before any other modules to ensure env vars are available
config({ path: join(__dirname, '../../.env.local') });
