-- Check if column exists first
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'quanlycongviec' 
  AND TABLE_NAME = 'Documents' 
  AND COLUMN_NAME = 'groupId';

-- If not exists, add column
-- Run this if the above query returns no results:
ALTER TABLE `Documents` 
ADD COLUMN `groupId` INT NULL AFTER `userId`;

-- Add foreign key constraint
ALTER TABLE `Documents`
ADD CONSTRAINT `fk_documents_groupId` 
FOREIGN KEY (`groupId`) REFERENCES `Groups`(`id`) 
ON UPDATE CASCADE 
ON DELETE SET NULL;

-- Mark migration as done
INSERT INTO `SequelizeMeta` (`name`) 
VALUES ('20251201000001-add-groupId-to-documents.js')
ON DUPLICATE KEY UPDATE name=name;
