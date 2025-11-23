-- Script để cho phép cột nguoiThucHienId trong bảng Subtasks có thể NULL

-- Bước 1: Xóa các FOREIGN KEY constraints dư thừa
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_2;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_3;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_4;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_5;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_6;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_7;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_8;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_9;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_10;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_11;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_12;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_13;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_14;
ALTER TABLE Subtasks DROP FOREIGN KEY IF EXISTS subtasks_ibfk_15;

-- Bước 2: Đổi cột nguoiThucHienId cho phép NULL
ALTER TABLE Subtasks 
MODIFY COLUMN nguoiThucHienId INT NULL COMMENT 'ID người thực hiện subtask';

-- Bước 3: Thêm lại FOREIGN KEY constraint duy nhất với ON DELETE SET NULL
ALTER TABLE Subtasks
ADD CONSTRAINT fk_subtasks_nguoiThucHienId 
FOREIGN KEY (nguoiThucHienId) 
REFERENCES Users(id) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Kiểm tra kết quả
SELECT 
    COLUMN_NAME,
    IS_NULLABLE,
    DATA_TYPE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'Subtasks' 
AND COLUMN_NAME = 'nguoiThucHienId';
