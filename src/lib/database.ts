import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Calculation } from './entities/Calculation';
import path from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/calculator.db';

const resolvedPath = path.isAbsolute(DATABASE_PATH)
  ? DATABASE_PATH
  : path.join(process.cwd(), DATABASE_PATH);

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (dataSource && dataSource.isInitialized) {
    return dataSource;
  }

  const fs = await import('fs');
  const dir = path.dirname(resolvedPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: resolvedPath,
    entities: [Calculation],
    synchronize: true,
    logging: false,
  });

  await dataSource.initialize();
  return dataSource;
}
