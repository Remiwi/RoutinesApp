import React, { createContext, useContext, FC, ReactNode } from 'react';
import * as SQLite from 'expo-sqlite';

/* Setup database */

const db = SQLite.openDatabase('routines.db');

db.transaction(tx => {
    // tx.executeSql(
    //     'DROP TABLE IF EXISTS routines;'
    // );

    tx.executeSql(
        'CREATE TABLE IF NOT EXISTS routines (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, position INTEGER NOT NULL UNIQUE, hidden INTEGER DEFAULT 0);'
    );
})


/* Setup context */

export type DatabaseType = SQLite.WebSQLDatabase;

const DatabaseContext = createContext<DatabaseType | null>(null);

interface DatabaseProviderProps {
    children: ReactNode;
}

export const DatabaseProvider: FC<DatabaseProviderProps> = ({children}) => {
    return (
        <DatabaseContext.Provider value={db}>
            {children}
        </DatabaseContext.Provider>
    )
}

export const useDatabase = () => {
    const database = useContext(DatabaseContext);
    if (!db) {
        throw new Error('useDatabase must be used within a DatabaseProvider');
    }
    return db;
}