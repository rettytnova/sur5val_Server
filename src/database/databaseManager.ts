import mysql, { FieldPacket, QueryResult, ResultSetHeader } from 'mysql2/promise';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SQL_QUERIES } from './user/user.queries.js';
import { toSnakeCase, timeFormatting } from '../utils/utils.js';

class DatabaseManager {
  private static gInstance: DatabaseManager | null = null;
  private pools: { [key: string]: any } = {};

  private constructor() {
    this.createPool('USER_DB', config.databases.userDB);
    this.createTables();
  }

  static getInstance() {
    if (DatabaseManager.gInstance === null) {
      DatabaseManager.gInstance = new DatabaseManager();
    }
    return DatabaseManager.gInstance;
  }

  createPool(poolName: string, dbConfig: any) {
    const pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.name,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    const originalQuery = pool.query;

    pool.query = async <T extends QueryResult>(sql: any, params?: any): Promise<[T, FieldPacket[]]> => {
      //쿼리 실행시 로그
      // const date = new Date();
      // console.log(
      //   `Executing query: ${sql} ${params ? `, ${JSON.stringify(params)}` : ``
      //   }`,
      // );

      const result = await originalQuery.call(pool, sql, params);
      return result as [T, FieldPacket[]];
    };

    this.pools[poolName] = pool;
  }

  // 테이블 생성
  async createTables(): Promise<void> {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const schemaPath = path.join(__dirname, 'schema.sql');
    const text = fs.readFileSync(schemaPath, 'utf-8');

    const jobs: Promise<any>[] = [];

    text.split(';').forEach((qry) => {
      if (!qry.trim()) return;
      jobs.push(this.execute('USER_DB', qry.trim()));
    });

    await Promise.all(jobs);
  }

  // Query 메서드 추가
  async query<T extends QueryResult>(poolName: string, sql: string, params?: any): Promise<[T, FieldPacket[]]> {
    const pool = this.pools[poolName];
    if (!pool) {
      throw new Error(`Pool with name ${poolName} does not exist.`);
    }
    return pool.query(sql, params);
  }

  // Execute 메서드 추가
  async execute<T extends QueryResult>(poolName: string, sql: string, params?: any): Promise<[T, FieldPacket[]]> {
    const pool = this.pools[poolName];
    if (!pool) {
      throw new Error(`Pool with name ${poolName} does not exist.`);
    }
    return pool.execute(sql, params);
  }

  async testDBConnection(pool: any, dbName: string) {
    try {
      const [rows] = await pool.query('SELECT 1 + 1 AS solution');
      console.log(`${dbName} 테스트 쿼리 결과:`, rows[0].solution);
    } catch (error) {
      console.error(`${dbName} 테스트 쿼리 실행 중 오류 발생`, error);
    }
  }

  async testAllDBConnection() {
    this.testDBConnection(this.pools.USER_DB, 'USER_DB');
  }

  /**
   * 사용자를 Nickname로 조회하는 함수
   * @param userNickname 사용자 Nickname
   * @returns 사용자 정보 (스네이크케이스로 변환된 객체)
   */
  findUserByNickname = async (userNickname: string): Promise<ResultSetHeader | null> => {
    try {
      // SQL 쿼리 실행
      const [rows] = await this.query('USER_DB', SQL_QUERIES.FIND_USER_BY_NICKNAME, [userNickname]);

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
  findUserByEmail = async (userEmail: string): Promise<ResultSetHeader | null> => {
    try {
      // SQL 쿼리 실행
      const [rows] = await this.query('USER_DB', SQL_QUERIES.FIND_USER_BY_EMAIL, [userEmail]);

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
  findUserByEmailPw = async (userEmail: string, userPw: string): Promise<ResultSetHeader | null> => {
    try {
      // SQL 쿼리 실행
      const [rows] = await this.query('USER_DB', SQL_QUERIES.FIND_USER_BY_EMAIL_AND_PW, [userEmail, userPw]);

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
  createUser = async (nickName: string, email: string, password: string): Promise<ResultSetHeader> => {
    const createdAt = timeFormatting(new Date());
    const MMR = 0;
    const win = 0;
    const lose = 0;

    const [result] = await this.execute('USER_DB', SQL_QUERIES.INSERT_USER, [
      nickName,
      email,
      password,
      createdAt,
      MMR,
      win,
      lose
    ]);

    return result as ResultSetHeader;
  };

  createSpawnPosition = async (
    mapNumber: number,
    spawnNumber: number,
    x: number,
    y: number,
    roleType: string
  ): Promise<ResultSetHeader> => {
    const [result] = await this.execute('USER_DB', SQL_QUERIES.INSERT_SPAWN_POSITION, [
      mapNumber,
      spawnNumber,
      x,
      y,
      roleType
    ]);

    return result as ResultSetHeader;
  };

  createSkillCard = async (cardType: number, coolTime: number): Promise<ResultSetHeader> => {
    const [result] = await this.execute('USER_DB', SQL_QUERIES.INSERT_SPAWN_POSITION, [cardType, coolTime]);

    return result as ResultSetHeader;
  };

  async characterInitStatInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_CHARACTER_INIT_STAT_INFO);
    return rows;
  }

  async characterLevelUpStatInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_CHARACTER_LEVEL_UP_STAT_INFO);
    return rows;
  }

  async consumableItemInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_CONSUMABLE_ITEM_INFO);
    return rows;
  }

  async equipItemInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_EQUIP_ITEM_INFO);
    return rows;
  }

  async monsterInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_MONSTER_INFO);
    return rows;
  }

  async shopListInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_SHOPLIST_INFO);
    return rows;
  }

  async initGameInfo() {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_INIT_GAME_INFO);
    return rows;
  }

  async spawnPositionInfo(mapNumber: number, roleType: string) {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_SPAWN_POSITION_INFO, [mapNumber, roleType]);
    return rows;
  }

  async skillCardInfo(cardType: number) {
    const [rows] = await this.pools['USER_DB'].query(SQL_QUERIES.FIND_SKILL_CARD, [cardType]);
    return rows;
  }
}

export default DatabaseManager;
