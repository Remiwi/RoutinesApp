import React, { createContext, useContext, FC, ReactNode } from "react";
import * as SQLite from "expo-sqlite";

/* Setup database */

const db = SQLite.openDatabase("routines.db");

db.transaction(
  (tx) => {
    // tx.executeSql(`DROP TABLE IF EXISTS routines;`);
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS routines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        position INTEGER NOT NULL,
        prev_position INTEGER DEFAULT NULL,
        hidden INTEGER DEFAULT 0,
        UNIQUE (position, prev_position)
    );`
    );
    // Having prev_position in the unique constraint, in addition to having prev_position match position at the start of every transaction, essentially
    // means that I can enforce `UNIQUE(position)` at any point during the transaction by setting prev_position = position, rather than having it enforced
    // at all times (which is what happens without prev_position in there). You have to update it manually every time you change positions, which in a way
    // kind of makes the constraint optional since you have to choose to enforce it, but it's better than having a real-time constraint.

    tx.executeSql(
      `CREATE TRIGGER IF NOT EXISTS routines_init_prev_position
      AFTER INSERT ON routines
      BEGIN
        UPDATE routines SET prev_position = position WHERE prev_position IS NULL;
      END;`
    );

    // tx.executeSql(`DROP TABLE IF EXISTS tasks;`);
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        routine_id INTEGER NOT NULL,
        name TEXT,
        position INTEGER NOT NULL,
        prev_position INTEGER DEFAULT NULL,
        hidden INTEGER DEFAULT 0,
        FOREIGN KEY (routine_id) REFERENCES routines (id),
        UNIQUE (routine_id, position, prev_position)
    );`
    );

    tx.executeSql(
      `CREATE TRIGGER IF NOT EXISTS tasks_init_prev_position
      AFTER INSERT ON tasks
      BEGIN
        UPDATE tasks SET prev_position = position WHERE prev_position IS NULL;
      END;`
    );
  },
  (e) => {
    console.log(e);
  }
);

/* Setup context */

export type DatabaseType = SQLite.WebSQLDatabase;

const DatabaseContext = createContext<DatabaseType | null>(null);

interface DatabaseProviderProps {
  children: ReactNode;
}

export const DatabaseProvider: FC<DatabaseProviderProps> = ({ children }) => {
  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const database = useContext(DatabaseContext);
  if (!database) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return database;
};
