import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Serverless HTTP client. One round trip per query, no connection pool to drain. */
export const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
