export const SQL_QUERIES = {
  FIND_USER_BY_NICKNAME: 'SELECT * FROM User WHERE nickname = ?',
  FIND_USER_BY_EMAIL: 'SELECT * FROM User WHERE email = ?',
  FIND_USER_BY_EMAIL_AND_PW:
    'SELECT * FROM User WHERE email = ? AND password = ?',
  INSERT_USER: `INSERT INTO User (nickname, email, password, createdAt, MMR, win, lose) VALUES(?, ?, ?, ?, ?, ?, ?)`,
} as const;
