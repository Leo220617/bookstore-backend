import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export class Database {
  constructor(filename) {
    this.filename = filename || './data.db';
    this.dbp = null;
  }

  async connect() {
    if (!this.dbp) {
      this.dbp = open({ filename: this.filename, driver: sqlite3.Database });
    }
    return this.dbp;
  }

  async init() {
    const db = await this.connect();
    await db.exec(`
      CREATE TABLE IF NOT EXISTS authors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        country TEXT
      );
      CREATE TABLE IF NOT EXISTS publishers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        city TEXT
      );
    `);
  }

  async run(sql, params = []) {
    const db = await this.connect();
    return db.run(sql, params);
  }

  async all(sql, params = []) {
    const db = await this.connect();
    return db.all(sql, params);
  }

  async get(sql, params = []) {
    const db = await this.connect();
    return db.get(sql, params);
  }
}
