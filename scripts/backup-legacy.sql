-- Executar com uma chave administrativa antes de qualquer remocao do legado.
-- O backup e idempotente e nao altera as tabelas de producao.
CREATE SCHEMA IF NOT EXISTS backup_legacy;
CREATE TABLE IF NOT EXISTS backup_legacy.tables_20260917 AS TABLE public.tables WITH NO DATA;
TRUNCATE backup_legacy.tables_20260917;
INSERT INTO backup_legacy.tables_20260917 SELECT * FROM public.tables;

DO $$
BEGIN
  IF to_regclass('public.mesas_izilda') IS NOT NULL THEN
    EXECUTE 'CREATE TABLE IF NOT EXISTS backup_legacy.mesas_izilda_20260917 AS TABLE public.mesas_izilda WITH NO DATA';
    EXECUTE 'TRUNCATE backup_legacy.mesas_izilda_20260917';
    EXECUTE 'INSERT INTO backup_legacy.mesas_izilda_20260917 SELECT * FROM public.mesas_izilda';
  END IF;
END $$;
