import mysql, { FieldPacket, QueryResult } from "mysql2/promise";
import { config } from "../config/config.js";

class DatabaseManager{
    private static gInstance: DatabaseManager | null = null;
    private pools: { [key: string]: any } = {};

    private constructor(){
        this.createPool("USER_DB", config.databases.userDB);
    }

    static getInstance(){
        if(DatabaseManager.gInstance === null)
        {
            DatabaseManager.gInstance = new DatabaseManager();
        }

        return DatabaseManager.gInstance;
    }

    // 풀 생성
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

    async testDBConnection(pool: any, dbName: string) {
        try {
            const [rows] = await pool.query("SELECT 1 + 1 AS solution");
            console.log(`${dbName} 테스트 쿼리 결과:`, rows[0].solution);
        } catch (error) {
            console.error(`${dbName} 테스트 쿼리 실행 중 오류 발생`, error);
        }
    }

    // DB와 연동이 잘 되어 있는지 확인
    async testAllDBConnection() {
        this.testDBConnection(this.pools.USER_DB, "USER_DB");
    }
}

export default DatabaseManager;