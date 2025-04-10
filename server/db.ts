import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Use the connection string directly
const connectionString = "postgresql://neondb_owner:npg_shAI2mCK8Qqw@ep-damp-art-a558hv4v-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require";

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
