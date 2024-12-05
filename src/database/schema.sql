-- SQLBook: Code
CREATE TABLE IF NOT EXISTS User (
    id         INT AUTO_INCREMENT PRIMARY KEY,       
    nickname   VARCHAR(36) COLLATE utf8_bin UNIQUE NOT NULL,           
    email      VARCHAR(255) UNIQUE NOT NULL,          
    password   VARCHAR(255) NOT NULL,             
    createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
    MMR        INT DEFAULT 0,                           
    win        INT DEFAULT 0,                          
    lose       INT DEFAULT 0                           
);

CREATE TABLE IF NOT EXISTS CharacterInitStat (
    characterType INT,
    attack INT,
    armor INT,
    hp INT,
    mp INT,
    handCards INT
);

CREATE TABLE IF NOT EXISTS CharacterLevelUpStat (
    characterType INT,
    attack INT,
    armor INT,
    hp INT
);

CREATE TABLE IF NOT EXISTS ConsumableItem (
    id INT(100) NOT NULL,
    cardType INT NOT NULL,
    price INT DEFAULT 0,
    hp INT DEFAULT 0,
    mp INT DEFAULT 0,
    exp INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS EquipItem (
    id INT(100) NOT NULL,
    cardType INT NOT NULL,
    price INT DEFAULT 0,
    attack INT DEFAULT 0,
    armor INT DEFAULT 0,
    hp INT DEFAULT 0
);

-- Table for initGame
CREATE TABLE IF NOT EXISTS InitGame (
    roundInitMonster INT,
    normalRoundTime INT,
    normalRoundNumber INT,
    bossRoundTime INT,
    attackCool INT,
    mpRestoreRate FLOAT
);

CREATE TABLE IF NOT EXISTS Monster (
    monsterType INT,
    nickname VARCHAR(255),
    level INT,
    hp INT,
    attack INT,
    attackCool INT,
    attackRange INT,
    armor INT,
    exp INT,
    gold INT,
    hpRecovery INT
);

CREATE TABLE IF NOT EXISTS ShopList (
    round INT,
    itemList JSON
);