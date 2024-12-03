export const SQL_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM User WHERE nickname = ?',  // 닉네임으로 유저 정보 찾기
  FIND_USER_BY_EMAIL: 'SELECT * FROM User WHERE email = ?', //이메일로 유저 정보찾기
  FIND_USER_BY_EMAIL_AND_PW:
    'SELECT * FROM User WHERE email = ? AND password = ?', // 이메일, 패스워드로 유저 정보 찾기
  INSERT_USER: `INSERT INTO User (nickname, email, password, createdAt, MMR, win, lose) VALUES(?, ?, ?, ?, ?, ?, ?)`, //유저 정보 입력하기 (회원가입)
  FIND_CHARACTER_INIT_STAT_INFO: 'SELECT * FROM CharacterInitStat', // 캐릭터 초기스탯 테이블 불러오기
  FIND_CHARACTER_LEVEL_UP_STAT_INFO: 'SELECT * FROM CharacterLevelUpStat', // 캐릭터 레벨업 테이블 불러오기
  FIND_INIT_GAME_INFO: 'SELECT * FROM InitGame', // 초기 게임 정보 찾기
  FIND_MONSTER_INFO: 'SELECT * FROM Monster', // 초기 몬스터 정보 찾기  
  FIND_SHOPLIST_INFO: 'SELECT * FROM ShopList ',
  FIND_CONSUMABLE_ITEM_INFO: 'SELECT * FROM ConsumableItem', // 소모품 아이템 테이블 불러오기
  FIND_EQUIP_ITEM_INFO: 'SELECT * FROM EquipItem' // 장비 아이템 테이블 불러오기
} as const;
