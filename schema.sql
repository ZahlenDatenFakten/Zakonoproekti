-- ======================================================
-- Скрипт инициализации бесплатной БД PostgreSQL / Supabase
-- Платформа: "Законопроект Онлайн" (LegalDraft Pro)
-- ======================================================

-- 1. Создание таблицы законопроектов
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_law TEXT NOT NULL,
    law_code TEXT,
    author TEXT NOT NULL,
    author_role TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    status_reason TEXT,
    explanatory_note TEXT,
    financial_justification TEXT,
    comparisons JSONB NOT NULL DEFAULT '[]'::jsonb,
    share_tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Индексы для быстрой фильтрации и поиска
CREATE INDEX IF NOT EXISTS idx_bills_status ON public.bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bills_target_law ON public.bills(target_law);

-- 3. Включение Row Level Security (RLS) для защиты данных
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- 4. Публичная политика доступа (Чтение и запись для приложения)
CREATE POLICY "Public Read Access" ON public.bills FOR SELECT USING (true);
CREATE POLICY "Public Write Access" ON public.bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Access" ON public.bills FOR UPDATE USING (true);
CREATE POLICY "Public Delete Access" ON public.bills FOR DELETE USING (true);

-- Готово! База данных готова к приему законопроектов.
