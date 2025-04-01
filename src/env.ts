export const env = {
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/postgres",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "secret",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
};
