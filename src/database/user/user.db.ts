import { ResultSetHeader } from 'mysql2/promise';
import DatabaseManager from '../databaseManager.js';
import { SQL_QUERIES } from './user.queries.js';
import { toSnakeCase, timeFormatting } from '../../utils/utils.js';

const dbManager = DatabaseManager.getInstance();

/**
 * 사용자를 Nickname로 조회하는 함수
 * @param userNickname 사용자 Nickname
 * @returns 사용자 정보 (스네이크케이스로 변환된 객체)
 */
export const findUserByNickname = async (
  userNickname: string,
): Promise<ResultSetHeader | null> => {
  try {
    // SQL 쿼리 실행
    const [rows] = await dbManager.query(
      'USER_DB',
      SQL_QUERIES.FIND_USER_BY_NICKNAME,
      [userNickname],
    );

    // 결과 확인 및 반환
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!result) console.warn('해당 닉네임를 가진 사용자를 찾을 수 없습니다');
    return result ? (toSnakeCase(result) as ResultSetHeader) : null;
  } catch (error) {
    // 에러 로깅
    console.error(`Error by Nickname: ${error}`);
    return null;
  }
};

/**
 * 사용자를 Email로 조회하는 함수
 * @param userEmail 사용자 Email
 * @returns 사용자 정보 (스네이크케이스로 변환된 객체)
 */
export const findUserByEmail = async (
  userEmail: string,
): Promise<ResultSetHeader | null> => {
  try {
    // SQL 쿼리 실행
    const [rows] = await dbManager.query(
      'USER_DB',
      SQL_QUERIES.FIND_USER_BY_EMAIL,
      [userEmail],
    );

    // 결과 확인 및 반환
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!result) console.warn('해당 이메일을 가진 사용자를 찾을 수 없습니다');
    return result ? (toSnakeCase(result) as ResultSetHeader) : null;
  } catch (error) {
    // 에러 로깅
    console.error(`Error by email: ${error}`);
    return null;
  }
};

/**
 * 사용자를 Email과 Pw로 조회하는 함수
 * @param userEmail 사용자 Email
 * @param userPw 사용자 PW
 * @returns 사용자 정보 (스네이크케이스로 변환된 객체)
 */
export const findUserByEmailPw = async (
  userEmail: string,
  userPw: string,
): Promise<ResultSetHeader | null> => {
  try {
    // SQL 쿼리 실행
    const [rows] = await dbManager.query(
      'USER_DB',
      SQL_QUERIES.FIND_USER_BY_EMAIL_AND_PW,
      [userEmail, userPw],
    );

    // 결과 확인 및 반환
    const result = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
    if (!result) console.warn('해당 계정을 가진 사용자를 찾을 수 없습니다');
    return result ? (toSnakeCase(result) as ResultSetHeader) : null;
  } catch (error) {
    // 에러 로깅
    console.error(`Error by email and password: ${error}`);
    return null;
  }
};

/**
 * 새로운 사용자를 생성하는 함수
 * @param id 사용자 ID
 * @param password 사용자 비밀번호
 * @param email 사용자 이메일
 * @returns MySQL 실행 결과
 */
export const createUser = async (
  nickName: string,
  email: string,
  password: string,
): Promise<ResultSetHeader> => {
  const createdAt = timeFormatting(new Date());
  const MMR = 0;
  const win = 0;
  const lose = 0;

  const [result] = await dbManager.execute('USER_DB', SQL_QUERIES.INSERT_USER, [
    nickName,
    email,
    password,
    createdAt,
    MMR,
    win,
    lose,
  ]);

  return result as ResultSetHeader;
};
