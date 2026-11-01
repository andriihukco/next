-- Rolls back 20261103000000_parse_jobs.sql. Run by hand with psql, never by the CLI.

drop table if exists public.parse_results;
drop table if exists public.parse_jobs;
