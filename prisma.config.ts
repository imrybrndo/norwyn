import 'dotenv/config'; // Prisma 7 config does not auto-load .env, so do it here.
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        // Direct connection (port 5432) — used by `prisma migrate` / introspection.
        // PgBouncer's transaction pooler (6543) can't run migrations.
        url: env('DIRECT_URL'),
    },
});
