import { useState, useEffect, useContext, createContext } from "react";
import { useDatabase } from "../../database";
import JustDate from "../../JustDate";

type TaskData = {
  routine_id: number;
  id: number;
  name: string;
  updateEntries: () => void;
  changeEntry: (date: JustDate, value: number) => void;
  getEntry: (date: JustDate) => number;
};

const TaskContext = createContext<TaskData | null>(null);

type TaskContextProviderProps = {
  routine_id: number;
  id: number;
  name: string;

  initialEntries?: Map<JustDate, number>;

  children: React.ReactNode;
};

export function TaskContextProvider(props: TaskContextProviderProps) {
  const db = useDatabase();
  const [dummy, setDummy] = useState(false);

  const initEntries: Map<number, number> = new Map();
  if (props.initialEntries !== undefined) {
    for (const [date, value] of props.initialEntries.entries())
      initEntries.set(date.toInt(), value);
  }
  const [entries, setEntries] = useState<Map<number, number>>(initEntries);

  const updateEntries = () =>
    db.transaction((tx) => {
      tx.executeSql(
        `
        SELECT date, value
        FROM entries
        WHERE
          task_id = ?
      `,
        [props.id],
        (_, { rows }) => {
          const newEntries = new Map<number, number>();
          for (let i = 0; i < rows.length; i++)
            newEntries.set(rows.item(i).date, rows.item(i).value);
          setEntries(newEntries);
        }
      );
    });

  useEffect(() => {
    if (props.initialEntries === undefined) updateEntries();
  }, []);

  const changeEntry = (date: JustDate, value: number) => {
    db.transaction((tx) => {
      tx.executeSql(
        `
        INSERT OR REPLACE INTO entries (task_id, date, value)
        VALUES (?, ?, ?)
      `,
        [props.id, date.toInt(), value],
        undefined,
        (_, error) => {
          console.log(error);
          return false;
        }
      );
    });

    entries.set(date.toInt(), value);
    setDummy(!dummy);
  };

  const getEntry = (date: JustDate) => entries.get(date.toInt()) ?? 0;

  return (
    <TaskContext.Provider
      value={{
        routine_id: props.routine_id,
        id: props.id,
        name: props.name,

        updateEntries: updateEntries,
        changeEntry: changeEntry,
        getEntry: getEntry,
      }}
    >
      {props.children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (context === null)
    throw new Error("useTaskContext must be used within a TaskContextProvider");
  return context;
}
