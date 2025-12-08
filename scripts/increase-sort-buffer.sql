-- Increase MySQL sort buffer size to handle large BLOB/TEXT columns
-- Run this as MySQL admin/root user

-- Check current values
SELECT @@sort_buffer_size;
SELECT @@max_sort_length;

-- Set for current session
SET SESSION sort_buffer_size = 8388608;  -- 8MB (default is usually 256KB)
SET SESSION max_sort_length = 8192;      -- 8KB (default is usually 1KB)

-- To set globally (persists across restarts if added to my.cnf/my.ini):
-- SET GLOBAL sort_buffer_size = 8388608;
-- SET GLOBAL max_sort_length = 8192;

-- Verify changes
SELECT @@sort_buffer_size;
SELECT @@max_sort_length;
