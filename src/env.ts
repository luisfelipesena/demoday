export const env = {
    DATABASE_URL: process.env.DATABASE_URL ?? "",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ?? "",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "",
    EMAIL_USER: process.env.EMAIL_USER ?? "",
    EMAIL_PASS: process.env.EMAIL_PASS ?? "",
};
