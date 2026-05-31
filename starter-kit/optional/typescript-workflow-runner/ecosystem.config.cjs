/**
 * PM2 Ecosystem Configuration
 *
 * Usage:
 *   pm2 start ecosystem.config.cjs
 *   pm2 start ecosystem.config.cjs --only workflow
 *   pm2 start ecosystem.config.cjs --only item-crud
 *
 * @see https://pm2.keymetrics.io/docs/usage/application-declaration/
 */

module.exports = {
  apps: [
    // =========================================================================
    // Full Workflow (all steps in sequence)
    // =========================================================================
    {
      name: "workflow",
      script: "npm",
      args: "start",
      cwd: __dirname,
      instances: 1,
      autorestart: false,  // Don't restart after completion
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      // Cron: Run daily at 00:00
      // cron_restart: "0 0 * * *",
    },

    // =========================================================================
    // Individual Jobs (for granular scheduling)
    // =========================================================================
    {
      name: "hello-world",
      script: "npm",
      args: "run hello-world",
      cwd: __dirname,
      instances: 1,
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "db-init",
      script: "npm",
      args: "run db-init",
      cwd: __dirname,
      instances: 1,
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "item-crud",
      script: "npm",
      args: "run item-crud",
      cwd: __dirname,
      instances: 1,
      autorestart: false,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
      // Cron: Run daily at 00:00
      // cron_restart: "0 0 * * *",
    },
  ],
};
