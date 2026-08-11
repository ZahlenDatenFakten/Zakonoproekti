# 🏛️ Официальный Государственный Реестр Законопроектов (LegalDraft Pro 2026)

Высокотехнологичный цифровой портал ведения, составления, правовой экспертизы, коллегиального голосования и публикации законопроектов и нормативно-правовых актов Штата San Andreas.

Приложение построено в стиле **GovTech / Deep Dark Techno-Minimalism** (Claude Code, Vercel, Linear) и полностью защищено по международным стандартам **Zero-Trust Security 2026** с криптографической проверкой целостности **SHA-256**, Anti-Bruteforce защитой и журналом аудита.

---

## 🌟 Ключевые Возможности Проекта

1. **Сравнительная матрица «Было / Стало» (Real-Time LCS Diff Engine)**:
   - Автоматическое вычисление удаленных (красный зачеркнутый) и добавленных (зеленый подсвеченный) слов и фраз.
   - Полноэкранный 3-режимный сплит-редактор (`Сплит`, `100% Протокол Diff`, `Сводный Акт`).
   - Отображение динамических метрик изменений (`+N слов / -M слов`).

2. **Двухуровневая Регламентная Модерация**:
   - **1-й этап (Специальная Законодательная Комиссия)**: Коллегиальное голосование 3-х главных должностных лиц Штата (⚖️ **Генеральный прокурор**, 🏛️ **Председатель Верховного суда**, 📜 **Губернатор**) по правилу большинства (кворум 2/3 или 3/3).
   - **2-й этап (Панель Администрации)**: Двухшаговый ввод в силу:
     - *Шаг 1:* Администратор выносит решение «✓ Одобрить 2-й этап».
     - *Шаг 2:* Нажимает «⚡ Изменить в законах» для вступления реформы в юридическую силу.

3. **Сфера Экспорта для Форумов (Forum Export Hub)**:
   - Генерация чистого готового текста новых статей (`becameContent`) в 1 клик для обновления официальных законодательных тем на форумах серверов (Majestic / GTA RP / SAMP / XenForo / Discourse).
   - Поддержка форматов: **📜 Новая редакция статей**, **🔍 Сравнительный протокол (Было / Стало)** и **🔤 BBCode**.

4. **Защита Zero-Trust Security 2026**:
   - **Anti-Bruteforce Defense Engine**: Блокировка ввода PIN-кода на 15 минут при 5 неудачных попытках.
   - **SHA-256 Hash Integrity**: Криптографический отпечаток целостности документа.
   - **Audit Trail**: Неисправляемый системный журнал безопасности всех действий администраторов и комиссий.
   - **Приватность черновиков**: Черновики видны строго только их авторам.

---

## 🔒 Безопасность и Технический Аудит (OWASP Top 10)

- **XSS & Injection Protection**: Использование чистого React 19 с автоматической экранировкой JSX и санитизатором `sanitizeInput()`.
- **Конфиденциальность ключей**: Сервисные токены и URL базы данных считываются строго из переменных окружения `.env`.
- **Защита от сбоев**: Архитектура Multi-Database Auto-Failover (Firebase -> Supabase PostgreSQL -> Local Vault).

---

# 🚀 ПОЛНОЕ РУКОВОДСТВО ПО ДЕПЛОЮ НА VPS СЕРВЕР (u1host / Ubuntu / Debian)

## 🛠️ ВАРИАНТ 1: Быстрый разворот через Docker & Docker Compose (РЕКОМЕНДУЕМЫЙ)

### Требования:
- VPS сервер на Linux (Ubuntu 20.04/22.04/24.04 или Debian 11/12).
- Установленный Docker и Docker Compose.

### Пошаговые команды:

1. **Подключитесь к вашему VPS по SSH**:
   ```bash
   ssh root@ВАШ_IP_АДРЕС
   ```

2. **Установите Docker (если еще не установлен)**:
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   ```

3. **Склонируйте репозиторий проекта**:
   ```bash
   git clone https://github.com/ZahlenDatenFakten/Zakonoproekti.git
   cd Zakonoproekti
   ```

4. **Запустите проект в Docker**:
   ```bash
   docker-compose up -d --build
   ```

5. **Проверьте статус контейнера**:
   ```bash
   docker ps
   ```
   *Приложение моментально станет доступно на порту 80 вашего VPS!*

---

## 🌐 ВАРИАНТ 2: Классический деплой через Nginx + SSL (Certbot)

Если вы хотите разместить проект на конкретном домене с бесплатным SSL-сертификатом Let's Encrypt:

### ШАГ 1: Установка зависимостей (Node.js 20, Git, Nginx, Certbot)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx curl certbot python3-certbot-nginx

# Установка Node.js v20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### ШАГ 2: Клонирование и Сборка Проекта
```bash
cd /var/www
git clone https://github.com/ZahlenDatenFakten/Zakonoproekti.git zakon_site
cd zakon_site
npm install
npm run build
```

### ШАГ 3: Настройка Nginx Конфигурации
1. Создайте конфигурационный файл для вашего домена:
   ```bash
   sudo nano /etc/nginx/sites-available/zakon_site
   ```

2. Вставьте готовую продакшн-конфигурацию (*замените `zakon.yourdomain.com` на ваш домен*):
   ```nginx
   server {
       listen 80;
       server_name zakon.yourdomain.com;

       root /var/www/zakon_site/dist;
       index index.html;

       # Gzip Сжатие
       gzip on;
       gzip_types text/plain text/css text/javascript application/javascript application/json image/svg+xml;

       # Безопасные HTTP-заголовки
       add_header X-Frame-Options "DENY" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;

       # Маршрутизация Single Page Application (SPA)
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Кэширование статики
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
           expires 1y;
           add_header Cache-Control "public, no-transform";
           access_log off;
       }
   }
   ```

3. Активируйте сайт и перезапустите Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/zakon_site /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### ШАГ 4: Выпуск бесплатного SSL-сертификата (HTTPS)
```bash
sudo certbot --nginx -d zakon.yourdomain.com
```

---

## 🗄️ Настройка базы данных PostgreSQL (Опционально для Supabase)

Если вы используете локальную БД PostgreSQL вместо Supabase Cloud:

1. Создайте базу данных и пользователя в `psql`:
   ```sql
   CREATE DATABASE legaldraft_db;
   CREATE USER legaldraft_user WITH PASSWORD 'secure_password_here';
   GRANT ALL PRIVILEGES ON DATABASE legaldraft_db TO legaldraft_user;
   ```
2. Выполните структурирование таблиц из файла `schema.sql`:
   ```bash
   psql -U legaldraft_user -d legaldraft_db -f schema.sql
   ```

---

## 🔄 Команда Обновления Проекта на Сервере

При выходе новых обновлений в репозитории выполните на сервере:

```bash
cd /var/www/zakon_site
git pull origin main
npm run build
sudo systemctl restart nginx
```

Или при использовании Docker:
```bash
cd /var/www/Zakonoproekti
git pull origin main
docker-compose up -d --build
```

---

## 🔑 Управление Ролями и Реестр PIN-кодов

Для доступа к разделам голосования Комиссии и Панели Администратора используются следующие роли и ключи верификации:

- ⚖️ **Генеральный прокурор**: PIN по умолчанию `111000`
- 🏛️ **Председатель Верховного суда**: PIN по умолчанию `222000`
- 📜 **Губернатор Штата**: PIN по умолчанию `333000`
- 🛡️ **Системный Администратор**: PIN по умолчанию `999000`

*Примечание:* Изменить служебные PIN-коды можно в окне «Идентификация» или через системный реестр настроек.
