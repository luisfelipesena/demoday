-- Simplificação do sistema de cadastro
-- 1. Primeiro, atualizamos os dados existentes
UPDATE "user" SET role = 'student_external' WHERE role = 'user';
UPDATE "votes" SET voter_role = 'student_external' WHERE voter_role = 'user';

-- 2. Alterações na tabela professor_evaluations (corrigir foreign key)
ALTER TABLE "professor_evaluations" DROP CONSTRAINT "professor_evaluations_professor_id_user_id_fk";
ALTER TABLE "professor_evaluations" ADD COLUMN "user_id" text NOT NULL DEFAULT '';
-- Migrar dados da coluna professor_id para user_id se houver dados
UPDATE "professor_evaluations" SET "user_id" = "professor_id" WHERE "professor_id" IS NOT NULL;
ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "professor_evaluations" DROP COLUMN "professor_id";

-- 3. Remover tabela de convites (não mais necessária)
DROP TABLE IF EXISTS "invites";

-- 4. Atualizar enum de roles
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DATA TYPE text;
ALTER TABLE "public"."votes" ALTER COLUMN "voter_role" SET DATA TYPE text;
DROP TYPE "public"."role";
CREATE TYPE "public"."role" AS ENUM('admin', 'student_ufba', 'student_external', 'professor');
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";
ALTER TABLE "public"."user" ALTER COLUMN "role" SET DEFAULT 'student_external';
ALTER TABLE "public"."votes" ALTER COLUMN "voter_role" SET DATA TYPE "public"."role" USING "voter_role"::"public"."role";