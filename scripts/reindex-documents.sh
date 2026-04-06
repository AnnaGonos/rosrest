#!/bin/bash

# Скрипт для переиндексирования документов
# Перед использованием установите переменные:
# - API_URL: адрес API (например, http://localhost:3000)
# - AUTH_TOKEN: JWT токен администратора

API_URL="${API_URL:-http://localhost:3000}"
AUTH_TOKEN="${AUTH_TOKEN:-}"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Ошибка: не установлена переменная AUTH_TOKEN${NC}"
    echo "Использование: AUTH_TOKEN=your_token API_URL=http://localhost:3000 $0 [command]"
    echo ""
    echo "Доступные команды:"
    echo "  all                - переиндексировать ВСЕ документы"
    echo "  type <TYPE>        - переиндексировать документы типа (charter/contracts/documents)"
    echo "  subcategory <ID>   - переиндексировать документы подкатегории с ID"
    exit 1
fi

function reindex_all() {
    echo -e "${YELLOW}Переиндексирование всех документов...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "${API_URL}/documents/reindex/all" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Успешно: $RESPONSE${NC}"
        return 0
    else
        echo -e "${RED}✗ Ошибка: $RESPONSE${NC}"
        return 1
    fi
}

function reindex_type() {
    local TYPE=$1
    
    if [ -z "$TYPE" ]; then
        echo -e "${RED}Ошибка: укажите тип документа (charter/contracts/documents)${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Переиндексирование документов типа '$TYPE'...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "${API_URL}/documents/reindex/type/${TYPE}" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Успешно: $RESPONSE${NC}"
        return 0
    else
        echo -e "${RED}✗ Ошибка: $RESPONSE${NC}"
        return 1
    fi
}

function reindex_subcategory() {
    local SUBCATEGORY_ID=$1
    
    if [ -z "$SUBCATEGORY_ID" ]; then
        echo -e "${RED}Ошибка: укажите ID подкатегории${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Переиндексирование документов подкатегории $SUBCATEGORY_ID...${NC}"
    
    RESPONSE=$(curl -s -X POST \
        "${API_URL}/documents/reindex/subcategory/${SUBCATEGORY_ID}" \
        -H "Authorization: Bearer ${AUTH_TOKEN}" \
        -H "Content-Type: application/json")
    
    if echo "$RESPONSE" | grep -q "success"; then
        echo -e "${GREEN}✓ Успешно: $RESPONSE${NC}"
        return 0
    else
        echo -e "${RED}✗ Ошибка: $RESPONSE${NC}"
        return 1
    fi
}

# Основная логика
COMMAND=$1
shift

case "$COMMAND" in
    all)
        reindex_all
        ;;
    type)
        reindex_type "$@"
        ;;
    subcategory)
        reindex_subcategory "$@"
        ;;
    *)
        echo -e "${RED}Неизвестная команда: $COMMAND${NC}"
        echo ""
        echo "Использование: $0 [command] [args]"
        echo ""
        echo "Доступные команды:"
        echo "  all                - переиндексировать ВСЕ документы"
        echo "  type <TYPE>        - переиндексировать документы типа (charter/contracts/documents)"
        echo "  subcategory <ID>   - переиндексировать документы подкатегории с ID"
        echo ""
        echo "Примеры:"
        echo "  AUTH_TOKEN=token $0 all"
        echo "  AUTH_TOKEN=token $0 type charter"
        echo "  AUTH_TOKEN=token $0 subcategory 5"
        exit 1
        ;;
esac
