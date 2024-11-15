export const SQL_QUERIES = {
  FIND_USER_BY_ID: 'SELECT * FROM User WHERE id = ?',
  INSERT_USER: `INSERT INTO User (id, email, password, createdAt, MMR, win, lose) VALUES(?, ?, ?, ?, ?, ?, ?)`,
} as const;
