// Must be the FIRST import of the server entrypoint. ES module imports are
// hoisted, so calling loadEnvConfig() in index.ts runs AFTER sibling imports
// (prisma, GameRoom) have already been evaluated — env must load here instead.
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());
