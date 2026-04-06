-- Переиндексирование документов по каждой подкатегории
-- Скрипт устанавливает orderIndex для всех документов которые его еще не имели

WITH ranked_documents AS (
    SELECT
        id,
        type,
        category_id,
        subcategory_id,
        "createdAt",
        ROW_NUMBER() OVER (
            PARTITION BY type, category_id, subcategory_id
            ORDER BY
                COALESCE("orderIndex", 2147483647) ASC,
                "createdAt" ASC,
                id ASC
        ) - 1 AS new_index
    FROM documents
)
UPDATE documents d
SET "orderIndex" = rd.new_index
FROM ranked_documents rd
WHERE d.id = rd.id
    AND (d."orderIndex" IS NULL OR d."orderIndex" = 0);
