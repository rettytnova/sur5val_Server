import { ResultSetHeader } from 'mysql2/promise';
import DatabaseManager from '../databaseManager.js';
import { SQL_QUERIES } from './user.queries.js';
import { toSnakeCase, timeFormatting } from '../../utils/utils.js';

const dbManager = DatabaseManager.getInstance();

/**
 * 사용자를 ID로 조회하는 함수
 * @param userId 사용자 ID
 * @returns 사용자 정보 (스네이크케이스로 변환된 객체)
 */
export const findUserById = async (
  userId: string,
): Promise<Record<string, unknown> | null> => {
  const [rows] = await dbManager.query('USER_DB', SQL_QUERIES.FIND_USER_BY_ID, [
    userId,
  ]);
  const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
  return result ? (toSnakeCase(result) as Record<string, unknown>) : null;
};

/**
 * 새로운 사용자를 생성하는 함수
 * @param id 사용자 ID
 * @param password 사용자 비밀번호
 * @param email 사용자 이메일
 * @returns MySQL 실행 결과
 */
export const createUser = async (
  id: string,
  email: string,
  password: string,
): Promise<ResultSetHeader> => {
  const createdAt = timeFormatting(new Date());
  const MMR = 0;
  const win = 0;
  const lose = 0;

  const [result] = await dbManager.execute('USER_DB', SQL_QUERIES.INSERT_USER, [
    id,
    email,
    password,
    createdAt,
    MMR,
    win,
    lose,
  ]);

  return result as ResultSetHeader;
};
