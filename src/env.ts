export const env = {
    DATABASE_URL:  "postgresql://demoday_owner:npg_1jKrTW4DuNGk@ep-cool-bonus-a5rsh1k5-pooler.us-east-2.aws.neon.tech/demoday?sslmode=require",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
};
