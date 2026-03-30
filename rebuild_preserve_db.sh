#!/bin/bash
set -euo pipefail

echo "=== Rebuild project without touching DB/volumes ==="

if [ ! -f docker-compose.yml ]; then
  echo "docker-compose.yml не найден в $(pwd). Перейдите в корень проекта и запустите снова." >&2
  exit 1
fi

TIMESTAMP=$(date +%F_%H%M%S)
BACKUP_DIR=/root/docker-volumes-backups-${TIMESTAMP}
mkdir -p "$BACKUP_DIR"

echo "1) Резервное копирование всех docker-томов в $BACKUP_DIR (по желанию)."
for v in $(docker volume ls -q); do
  echo " - Архивирую том: $v"
  docker run --rm -v ${v}:/volume -v ${BACKUP_DIR}:/backup alpine sh -c "cd /volume && tar czf /backup/${v}-backup-${TIMESTAMP}.tar.gz ." || echo "Не удалось заархивировать $v"
done

echo "2) Показываю список томов и контейнеров (проверьте, что важные тома присутствуют)"
docker volume ls
docker ps -a --format 'table {{.Names}}\t{{.Status}}\t{{.Image}}'

echo "3) Получаю актуальный конфиг docker-compose (проверка)"
docker compose -f docker-compose.yml config || docker-compose -f docker-compose.yml config || true

echo "4) Обновляю исходники из репозитория (рекомендуется сделать в отдельной папке — опция)"
echo "Если вы уже в нужной папке с кодом, пропустите. Иначе выполните рядом:"
echo "  cd /root && git clone git@github.com:AnnaGonos/rosrest.git rosrest-remote"

echo "5) Подтягиваю/пересобираю необходимые сервисы (НЕ включаю сервисы БД и другие, которые нельзя пересоздавать)."
echo "Замените service1 service2 на реальные имена сервисов: например api site admin"
SERVICES="api site admin"

echo "5a) Опционально: подтянуть образы из registry"
docker compose -f docker-compose.yml pull || true

echo "5b) Построить локальные образы для указанных сервисов"
for s in $SERVICES; do
  echo "Building $s"
  docker compose -f docker-compose.yml build $s || docker-compose -f docker-compose.yml build $s
done

echo "5c) Перезапустить (пересоздать) только указанные сервисы без зависимостей -- не трогаем БД/volumes"
for s in $SERVICES; do
  echo "Up $s"
  docker compose -f docker-compose.yml up -d --no-deps --build $s || docker-compose -f docker-compose.yml up -d --no-deps --build $s
done

echo "6) Проверка логов для указанных сервисов (последние 200 строк)"
for s in $SERVICES; do
  echo "--- logs $s ---"
  docker compose -f docker-compose.yml logs --tail 200 $s || docker-compose -f docker-compose.yml logs --tail 200 $s || true
done

echo "7) Проверка, не были ли удалены тома/бд:"
docker volume ls

echo "=== Готово. Если нужны конкретные имена сервисов или помощь с конфликтами — пришлите вывод команд выше ==="
exit 0
