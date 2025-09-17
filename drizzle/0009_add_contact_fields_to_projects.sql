-- Adicionar novos campos obrigatórios para submissão de projetos
ALTER TABLE projects 
ADD COLUMN contact_email text,
ADD COLUMN contact_phone text,
ADD COLUMN advisor_name text;

-- Atualizar projetos existentes com valores padrão
UPDATE projects 
SET 
  contact_email = 'admin@example.com',
  contact_phone = '(00) 00000-0000',
  advisor_name = 'Orientador Não Informado'
WHERE contact_email IS NULL;

-- Tornar os campos obrigatórios
ALTER TABLE projects 
ALTER COLUMN contact_email SET NOT NULL,
ALTER COLUMN contact_phone SET NOT NULL,
ALTER COLUMN advisor_name SET NOT NULL;

-- Também tornar authors obrigatório
ALTER TABLE projects 
ALTER COLUMN authors SET NOT NULL; 