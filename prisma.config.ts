import 'dotenv/config'; // Prisma 7 config does not auto-load .env, so do it here.
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    // Direct connection (port 5432) — used by `prisma migrate` / introspection.
    // PgBouncer's transaction pooler (6543) can't run migrations.
    // Only wired up when DIRECT_URL is set: `prisma generate` needs no database,
    // and CI/build environments (e.g. Railway) may not define this variable.
    ...(process.env.DIRECT_URL ? { datasource: { url: env('DIRECT_URL') } } : {}),
});
