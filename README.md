# 🏛️ Официальный Государственный Портал Законопроектов (LegalDraft Pro 2026)

Система ведения, составления, коллегиального рассмотрения и публикаций законопроектов. Защищена по стандартам **Zero-Trust Security 2026** с криптографическим отпечатком **SHA-256**, анти-брутфорс защитой и журналом аудита.

---

## 🌟 Ключевой Функционал
- **Сравнительная матрица «Было / Стало»**: Редактирование и просмотр с поддержкой полноэкранного режима для крупных кодексов и законов.
- **Двухуровневая модерация**:
  - **1-й этап (Специальная Законодательная Комиссия)**: Коллегиальное голосование 3-х членов комиссии (⚖️ **Генеральный прокурор**, 🏛️ **Председатель Верховного суда**, 📜 **Губернатор**) по правилу большинства (2/3 или 3/3).
  - **2-й этап (Федеральное Правительство)**: Окончательное утверждение или возврат на доработку с обязательным мотивированным обоснованием.
- **Безопасность 2026**: SHA-256 хэширование целостности документов, Anti-Bruteforce блокировка PIN-кодов (5 попыток -> 15 минут лок), неисправляемый Журнал Аудита (Audit Trail).
- **Приватность черновиков**: Черновики авторов видны строго только их создателям до публикации.
- **Отсутствие назойливых всплывающих окон браузера**: Защищенные `autocomplete="new-password"` формы.

---

# 🚀 Руководство по Деплою на VPS u1host.com (Второй сайт)

Тариф: **DE-5950X-2** (2 vCPU / 4 ГБ ОЗУ / 60 ГБ SSD).

### 📌 Что понадобится:
1. Данные для подключения к VPS от u1host (IP-адрес сервера и пароль `root`).
2. Второй домен или поддомен (например, `zakon.yourdomain.com`), направленный на IP вашего сервера.

---

### ШАГ 1: Подключение к VPS серверу по SSH

1. Откройте **PowerShell** или **Командную строку** (или PuTTY).
2. Введите команду для подключения (замените `123.45.67.89` на IP вашего VPS):
   ```bash
   ssh root@123.45.67.89
   ```
3. Введите пароль `root` из личного кабинета u1host.

---

### ШАГ 2: Установка программ (Node.js, Git, Nginx, PostgreSQL)

Скопируйте и вставьте команды в консоль сервера:

1. **Обновление системы**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```
2. **Установка Git и Nginx**:
   ```bash
   sudo apt install -y git nginx curl
   ```
3. **Установка Node.js (v20)**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

---

### ШАГ 3: Настройка Базы Данных PostgreSQL на VPS

1. Установите PostgreSQL:
   ```bash
   sudo apt install -y postgresql postgresql-contrib
   ```
2. Войдите в управление PostgreSQL:
   ```bash
   sudo -u postgres psql
   ```
3. Создайте базу данных и пользователя (*замените `my_password` на ваш пароль*):
   ```sql
   CREATE DATABASE legaldraft_db;
   CREATE USER legaldraft_user WITH PASSWORD 'my_password';
   GRANT ALL PRIVILEGES ON DATABASE legaldraft_db TO legaldraft_user;
   \c legaldraft_db;
   ```
4. Вставьте таблицу из `schema.sql`:
   ```sql
   CREATE TABLE IF NOT EXISTS public.bills (
       id VARCHAR(128) PRIMARY KEY,
       title TEXT NOT NULL,
       target_law TEXT NOT NULL,
       law_code VARCHAR(64),
       author VARCHAR(256) NOT NULL,
       author_role VARCHAR(128) NOT NULL,
       status VARCHAR(64) NOT NULL,
       status_reason TEXT,
       explanatory_note TEXT,
       comparisons JSONB,
       share_tokens JSONB,
       comments JSONB,
       votes JSONB,
       federal_verdict JSONB,
       sha256_hash VARCHAR(128),
       created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
       view_count INT DEFAULT 1
   );
   \q
   ```

---

### ШАГ 4: Скачивание проекта с GitHub и Сборка

1. Перейдите в папку веб-сайтов:
   ```bash
   cd /var/www
   ```
2. Скачайте проект в отдельную папку `site2_zakon`:
   ```bash
   git clone https://github.com/ZahlenDatenFakten/Zakonoproekti.git site2_zakon
   ```
3. Перейдите в папку второго сайта и скомпилируйте его:
   ```bash
   cd site2_zakon
   npm install
   npm run build
   ```

---

### ШАГ 5: Настройка Nginx для ВТОРОГО сайта (Без конфликта с первым!)

1. Создайте конфигурацию Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/site2_zakon
   ```
2. Вставьте конфигурацию (*замените `zakon.yourdomain.com` на ваш второй домен*):
   ```nginx
   server {
       listen 80;
       server_name zakon.yourdomain.com; # ВАШ ВТОРОЙ ДОМЕН

       root /var/www/site2_zakon/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
3. Сохраните: `Ctrl + O` -> `Enter`. Выйдите: `Ctrl + X`.
4. Включите второй сайт и перезапустите Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/site2_zakon /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

### ШАГ 6: Бесплатный SSL-сертификат (HTTPS)

1. Установите Certbot:
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   ```
2. Выпустите бесплатный SSL-сертификат:
   ```bash
   sudo certbot --nginx -d zakon.yourdomain.com
   ```

---

### 🎉 ГОТОВО!
Ваш **Второй сайт** работает 24/7 по адресу: **`https://zakon.yourdomain.com`**!

#### 🔄 Обновление сайта после изменений в коде:
```bash
cd /var/www/site2_zakon
git pull origin main
npm run build
```
