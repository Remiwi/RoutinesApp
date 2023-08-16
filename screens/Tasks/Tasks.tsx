import React, { useState, useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { colors } from "../../variables";

import Title from "../../components/Title/Title";
import { DragAndDropScrollView } from "../../components/DragAndDrop/DragAndDrop";
import TaskBubble from "./TaskBubble";
import Day from "./TaskDay";

export default function Tasks({ route, navigation }: any) {
  // Scrollview
  const [scrollEnabled, setScrollEnabled] = useState<boolean>(true);
  // Routine params
  const { routine_id, routine_name } = route.params;
  // DOM State
  const [taskData, setTaskData] = useState<any[]>([]);
  const [days, setDays] = useState<React.ReactNode[]>([]);
  const [activeDay, setActiveDay] = useState<number>(0); // 0 = today, 1 = yesterday, etc
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => {
      const the_days = [];
      for (let i = 0; i < 7; i++) {
        the_days.push(<Day days_back={i} active={activeDay === i} key={i} />);
      }
      setDays(the_days);

      setLoading(false);
    }, 0);
  }, []);

  if (loading) {
    return <></>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background_grey }}>
      <Title title={routine_name} onPressAdd={() => {}} buttons={[]}></Title>
      <View style={styles.days_container}>
        <View style={styles.days}>{days}</View>
      </View>
      <DragAndDropScrollView
        itemGap={5}
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.task_bubbles}
      >
        {taskData.map((task: any, index: number) => {
          return (
            <TaskBubble
              taskName={task.name}
              index={index}
              setScrollEnabled={setScrollEnabled}
              onDragFinished={() => {}}
            />
          );
        })}
      </DragAndDropScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  task_bubbles: {
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 5,
    gap: 5,
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
