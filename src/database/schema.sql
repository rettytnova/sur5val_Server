CREATE TABLE IF NOT EXISTS User (
    seq_no     INT AUTO_INCREMENT PRIMARY KEY,       
    id         VARCHAR(36) COLLATE utf8_bin UNIQUE NOT NULL,           
    email      VARCHAR(255) UNIQUE NOT NULL,          
    password   VARCHAR(255) NOT NULL,             
    createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
    MMR        INT DEFAULT 0,                           
    win        INT DEFAULT 0,                          
    lose       INT DEFAULT 0                           
);
