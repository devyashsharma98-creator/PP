module.exports = {
  apps: [
    {
      name: "pragya-pravah-ui",
      cwd: __dirname,
      script: "npm",
      args: "start",
      exec_mode: "fork",
      instances: 1,
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        DATABASE_URL: "postgresql://neondb_owner:npg_oikNG9B6JCQg@ep-ancient-night-aehdo40b-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
        NEON_DATABASE_URL: "postgresql://neondb_owner:npg_oikNG9B6JCQg@ep-ancient-night-aehdo40b-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require",
        JWT_SECRET: "pragya-pravah-production-jwt-secret-2026",
        APP_SESSION_SECRET: "pragya-pravah-neon-session-secret-2026",
        APP_ORG_CODE: "bhopal_vibhag",
        SESSION_COOKIE_NAME: "pp_session",
        SESSION_COOKIE_TTL_SECONDS: "86400",
        NEXT_PUBLIC_ENABLE_DEMO_DATA_FALLBACK: "false",
        NEXT_PUBLIC_ENABLE_DEMO_ROLE_SWITCH: "false",
      },
    },
  ],
};
