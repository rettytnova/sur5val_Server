import mysql, { FieldPacket, QueryResult } from 'mysql2/promise';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
      queueLimit: 0,
    });

    const originalQuery = pool.query;

    pool.query = async <T extends QueryResult>(
      sql: any,
      params?: any,
    ): Promise<[T, FieldPacket[]]> => {
      // 쿼리 실행시 로그
      // const date = new Date();
      // console.log(
      //     `[${FormatDate(date)}] Executing query: ${sql} ${params ? `, ${JSON.stringify(params)}` : ``
      //     }`,
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
  async query<T extends QueryResult>(
    poolName: string,
    sql: string,
    params?: any,
  ): Promise<[T, FieldPacket[]]> {
    const pool = this.pools[poolName];
    if (!pool) {
      throw new Error(`Pool with name ${poolName} does not exist.`);
    }
    return pool.query(sql, params);
  }

  // Execute 메서드 추가
  async execute<T extends QueryResult>(
    poolName: string,
    sql: string,
    params?: any,
  ): Promise<[T, FieldPacket[]]> {
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
}

export default DatabaseManager;
