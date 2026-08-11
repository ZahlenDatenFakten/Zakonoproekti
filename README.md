# 🏛️ Официальный Государственный Реестр Законопроектов (LegalDraft Pro 2026)

Высокотехнологичный цифровой портал ведения, составления, правовой экспертизы, коллегиального голосования и публикации законопроектов и нормативно-правовых актов Штата San Andreas.

Приложение построено в стиле **GovTech / Deep Dark Techno-Minimalism** (Claude Code, Vercel, Linear) и полностью защищено по международным стандартам **Zero-Trust Security 2026** с криптографической проверкой целостности **SHA-256**, Anti-Bruteforce защитой и журналом аудита.

---

# 📖 ПОЛНОЕ ПОШАГОВОЕ РУКОВОДСТВО ПО ДЕПЛОЮ НА VPS СЕРВЕР u1host.com
*(Тариф DE-5950X-2: 2 vCPU / 4 ГБ ОЗУ / 60 ГБ NVMe)*

---

### 📌 ЧТО ПОНАДОБИТСЯ ПЕРЕД НАЧАЛОМ:
1. Данные от хостинга **u1host.com**: IP-адрес вашего VPS сервера и пароль пользователя `root`.
2. Доменное имя (например, `zakon-sa.ru` или `zakon.yourdomain.com`).
3. Ссылка на GitHub-репозиторий: `https://github.com/ZahlenDatenFakten/Zakonoproekti.git`

---

## 🌐 ШАГ 1: Привязка Домена к IP Вашего VPS u1host

1. Зайдите в личный кабинет регистратора вашего домена (Reg.ru, Cloudflare, 2domains, Ru-Center и т.д.).
2. Перейдите в раздел **«Управление DNS-записями»**.
3. Добавьте новую **A-запись**:
   - **Имя (Host):** `@` (для основного домена) или `zakon` (для поддомена).
   - **Тип:** `A`
   - **Значение (Value):** `IP_ВАШЕГО_VPS_СЕРВЕРА` (например: `185.123.45.67`)
   - **TTL:** `300` (или по умолчанию).

---

## 🖥️ ШАГ 2: Подключение к VPS Серверу u1host по SSH

1. На вашем компьютере откройте **PowerShell** (Windows) или **Терминал** (macOS / Linux).
2. Введите команду подключения (*замените `185.123.45.67` на реальный IP вашего VPS*):
   ```bash
   ssh root@185.123.45.67
   ```
3. Если появилось сообщение `Are you sure you want to continue connecting (yes/no)?`, введите `yes` и нажмите `Enter`.
4. Вставьте пароль `root` из личного кабинета u1host и нажмите `Enter` *(символы пароля при вводе в консоли не отображаются — это нормально)*.

---

## 📦 ШАГ 3: Подготовка Сервера (Установка Docker, Git и Nginx)

Скопируйте и вставьте в консоль VPS сервера единый блок команд:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx certbot python3-certbot-nginx
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
```

---

## 📥 ШАГ 4: Скачивание Проекта из GitHub

1. Перейдите в директорию веб-сайтов на сервере:
   ```bash
   cd /var/www
   ```
2. Загрузите файлы проекта напрямую из GitHub:
   ```bash
   git clone https://github.com/ZahlenDatenFakten/Zakonoproekti.git
   cd Zakonoproekti
   ```

---

## ⚡ ШАГ 5: Сборка и Запуск Проекта в Docker (1 Кликом!)

Запустите автоматическую сборку и запуск приложения:

```bash
docker-compose up -d --build
```

*Приложение автоматически скомпилируется в ультра-быстрый статичный пакет и запустит защищенный веб-сервер Nginx на порту 80.*

Проверьте статус запущенного контейнера:
```bash
docker ps
```
*Вы увидите активный контейнер `state_registry_app` со статусом `Up (healthy)`.*

---

## 🔒 ШАГ 6: Настройка Бесплатного SSL-Сертификата (HTTPS Защита)

Чтобы на вашем сайте включился зеленый замочек безопасности `https://`:

1. Создайте конфигурацию Nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/zakonoproekti
   ```

2. Вставьте следующий код (*замените `yourdomain.com` на имя вашего домена*):
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
3. Нажмите `Ctrl + O`, затем `Enter` для сохранения. Нажмите `Ctrl + X` для выхода.

4. Активируйте сайт и выпустите SSL-сертификат Let's Encrypt:
   ```bash
   sudo ln -s /etc/nginx/sites-available/zakonoproekti /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   sudo certbot --nginx -d yourdomain.com
   ```
5. Certbot предложит автоматический редирект с HTTP на HTTPS — выберите вариант `2` (Redirect).

---

## 🎉 ПОЗДРАВЛЯЕМ! ВАШ САЙТ УСПЕШНО РАБОТАЕТ 24/7!
Адрес вашего портала: **`https://yourdomain.com`**

---

## 🔄 КАК ОБНОВЛЯТЬ САЙТ ПОСЛЕ ВНЕСЕНИЯ ИЗМЕНЕНИЙ В GITHUB:

Когда вы вносите новые правки в код на компьютере и делаете `git push`, обновить рабочий сайт на VPS u1host можно одной командой:

```bash
cd /var/www/Zakonoproekti
git pull origin main
docker-compose up -d --build
```

---

## 🔑 КЛЮЧИ И СЛУЖЕБНЫЕ PIN-КОДЫ ПО УМОЛЧАНИЮ:
- ⚖️ **Генеральный прокурор**: `111000`
- 🏛️ **Председатель Верховного суда**: `222000`
- 📜 **Губернатор Штата**: `333000`
- 🛡️ **Системный Администратор**: `999000`
