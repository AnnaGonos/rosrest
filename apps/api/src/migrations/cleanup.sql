-- Удаление дублирующихся миграций из таблицы
DELETE FROM migrations 
WHERE name IN (
  'RemoveDuplicateCategories1705680000000',
  'DeleteAllDocumentsAndCategories1705680000001', 
  'AddIconToDocumentCategories1705680000002'
);

-- Проверка оставшихся миграций
SELECT * FROM migrations ORDER BY id DESC;
