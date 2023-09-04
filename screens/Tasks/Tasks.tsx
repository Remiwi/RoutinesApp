import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Vibration } from "react-native";
import { useDatabase } from "../../database";
import { TaskContextProvider } from "./TaskContext";
import { getToday, getDaysBack } from "../../date";
import { colors } from "../../variables";

import Title from "../../components/Title/Title";
import { DragAndDropScrollView } from "../../components/DragAndDrop/DragAndDrop";
import TaskBubble from "./TaskBubble";
import Day from "./TaskDay";
import TextInputModal from "../../components/TextInputModal/TextInputModal";

export default function Tasks({ route, navigation }: any) {
  // Database
  const db = useDatabase();
  // Scrollview
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);
  // Routine params
  const { routine_id, routine_name } = route.params;
  // DOM State
  const [taskData, setTaskData] = useState<any[]>([]);
  // Date
  const [activeDay, setActiveDay] = useState<number>(getToday());
  const activeDayRef = useRef(activeDay);
  // Modals
  const [addModalVisible, setAddModalVisible] = useState<boolean>(false);
  const [addErrorMsg, setAddErrorMsg] = useState<string>("");

  const updateTaskData = () => {
    db.transaction(
      (tx) => {
        tx.executeSql(
          `SELECT * FROM tasks WHERE routine_id = ? AND hidden != ? ORDER BY position ASC;`,
          [routine_id, getToday()],
          (_, { rows: { _array } }) => {
            const updated_tasks = _array;

            tx.executeSql(
              `
              SELECT *
              FROM entries
              WHERE
                date > ? AND
                task_id IN (
                  SELECT id FROM tasks WHERE routine_id = ? AND hidden != ?
                )
              ORDER BY date DESC;
            `,
              [getDaysBack(7), routine_id, getToday()],
              (_, { rows: { _array } }) => {
                updated_tasks.forEach((task: any) => {
                  task.entries = _array.filter(
                    (entry: any) => entry.task_id === task.id
                  );
                });
                setTaskData(updated_tasks);
              }
            );
          }
        );
      },
      (e) => {
        console.log(e);
      }
    );
  };

  useEffect(() => {
    updateTaskData();
  }, []);

  // Add task stuff
  const handleAddCancel = () => {
    setAddModalVisible(false);
    setAddErrorMsg("");
  };

  const handleAddConfirm = (text: string) => {
    if (text === "") {
      setAddErrorMsg("New routine must be given a name");
    } else {
      // get number of routines
      db.transaction(
        (tx) => {
          tx.executeSql(
            `SELECT COUNT(*) FROM tasks WHERE routine_id = ?;`,
            [routine_id],
            (_, { rows: { _array } }) => {
              const num_routines = _array[0]["COUNT(*)"];
              tx.executeSql(
                `INSERT INTO tasks (routine_id, position, name) VALUES (?, ?, ?);`,
                [routine_id, num_routines, text]
              );
            }
          );
        },
        (e) => {
          console.log(e);
        }
      );
      updateTaskData();
      setAddModalVisible(false);
      setAddErrorMsg("");
    }
  };

  // Moving bubbles after drag and drop
  // Moves bubble at startIndex to endIndex, and bumps betweeners either up or down depending on, opposite the direction the dragged bubble went
  const moveBubbles = (startIndex: number, endIndex: number) => {
    if (startIndex === endIndex) return;

    const startId = taskData[startIndex].id;
    const startPos = taskData[startIndex].position;
    const endPos = taskData[endIndex].position;

    db.transaction((tx) => {
      // Update positions
      tx.executeSql(
        `
        UPDATE tasks SET position = CASE
            WHEN id = ? THEN ?
            WHEN position BETWEEN ? AND ? THEN position - 1
            WHEN position BETWEEN ? AND ? THEN position + 1
            ELSE position
          END
        WHERE routine_id = ?;
      `,
        [
          startId,
          endPos,
          startPos + 1,
          endPos,
          endPos,
          startPos - 1,
          routine_id,
        ],
        undefined,
        (_, e) => {
          console.log(e);
          return false;
        }
      );

      // Update prev_positions. Effectively allows the UNIQUE(position, routine_id) to be enforced.
      tx.executeSql(
        `UPDATE tasks SET prev_position = position WHERE prev_position != position;`,
        [],
        () => updateTaskData(),
        (_, e) => {
          console.log(e);
          return false;
        }
      );
    });
  };

  // Unhide all routines
  const handleUnhideAll = () => {
    db.transaction((tx) => {
      tx.executeSql(`UPDATE tasks SET hidden = 0 WHERE routine_id = ?;`, [
        routine_id,
      ]);
    });
    updateTaskData();
  };

  return (
    <>
      <TextInputModal
        visible={addModalVisible}
        msg="Add a new task"
        errorMsg={addErrorMsg}
        handleConfirm={handleAddConfirm}
        handleCancel={handleAddCancel}
      />

      <View style={{ flex: 1, backgroundColor: colors.background_grey }}>
        <Title
          title={routine_name}
          onPressAdd={() => setAddModalVisible(true)}
          buttons={[
            {
              label: "Unhide All",
              onPress: handleUnhideAll,
            },
          ]}
        ></Title>
        <View style={styles.days_container}>
          <View style={styles.days}>
            {Array.from({ length: 7 }, (_, i) => (
              <Day
                days_back={i}
                active={activeDay === getDaysBack(i)}
                onLongPress={() => {
                  Vibration.vibrate(100);
                  setActiveDay(getDaysBack(i));
                }}
                key={i}
              />
            ))}
          </View>
        </View>
        <DragAndDropScrollView
          itemGap={5}
          scrollEnabled={scrollEnabled}
          contentContainerStyle={styles.task_bubbles}
        >
          {taskData.map((task: any, index: number) => {
            return (
              <TaskContextProvider
                routine_id={-1}
                id={task.id}
                name={task.name}
                key={task.id}
              >
                <TaskBubble
                  index={index}
                  activeDay={activeDay}
                  setScrollEnabled={setScrollEnabled}
                  onDragFinished={moveBubbles}
                  onChange={updateTaskData}
                />
              </TaskContextProvider>
            );
          })}
        </DragAndDropScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  task_bubbles: {
    flexDirection: "column",
    padding: 5,
    gap: 5,
    flexGrow: 1,
  },

  days_container: {
    width: "100%",
    paddingTop: 5,
    paddingLeft: 27,
    paddingRight: 20,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  days: {
    width: "64%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  day_text: {
    fontFamily: "notoSansRegular",
    fontSize: 12,
    color: colors.grey,
    fontWeight: "bold",
  },
});
