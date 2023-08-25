import React, { useRef, useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Vibration,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
  GestureResponderEvent,
  PanResponderGestureState,
  TouchableNativeFeedback,
} from "react-native";
import { useDatabase } from "../../database";
import { colors } from "../../variables";
import { getToday, getDaysBack } from "../../date";

import { DragAndDropItem } from "../../components/DragAndDrop/DragAndDrop";
import DragUpMenuModal from "../../components/DragUpMenuModal/DragUpMenuModal";

const CIRCLE_EMPTY = require("../../assets/icons/circle_empty.png");
const CIRCLE_HALF = require("../../assets/icons/circle_half.png");
const CIRCLE_FULL = require("../../assets/icons/circle_full.png");
const CLOSE_ICON = require("../../assets/icons/close.png");

const OPEN_THRESHOLD = 20;
const CLOSE_THRESHOLD = -20;
const HIDE_THRESHOLD = -50;
const OPEN_POSITION = 250;
const HIDDEN_POSITION_OFFSET = 250;
const HIDE_DURATION = 300;
const HIDE_ON_SET = false;

type TaskBubbleProps = {
  taskName: string;
  id: number;
  index: number;
  activeDay: number;
  entries: any[];
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onDragFinished: (startIndex: number, endIndex: number) => void;
  onChange: () => void;
};

export default function TaskBubble({
  taskName,
  index,
  id,
  activeDay,
  entries,
  setScrollEnabled,
  onDragFinished,
  onChange,
}: TaskBubbleProps) {
  // Drag and Drop
  const startDragRef = useRef<() => void>(() => {});
  const dragOngoingRef = useRef(false);
  const setDragStylesEnabledRef = useRef<(enabled: boolean) => void>(() => {});
  const cancelDragRef = useRef<() => void>(() => {});

  return (
    <DragAndDropItem
      itemIndex={index}
      startDragRef={startDragRef}
      cancelDragRef={cancelDragRef}
      onDragStarted={() => {
        dragOngoingRef.current = true;
      }}
      onDragFinishing={() => {
        dragOngoingRef.current = false;
        setDragStylesEnabledRef.current(false);
      }}
      onDragFinished={onDragFinished}
      contentContainerStyleSelected={{ zIndex: 1 }}
    >
      <SlideableBubble
        taskName={taskName}
        id={id}
        activeDay={activeDay}
        entries={entries}
        startDragRef={startDragRef}
        cancelDragRef={cancelDragRef}
        dragOngoingRef={dragOngoingRef}
        setScrollEnabled={setScrollEnabled}
        setDragStylesEnabledRef={setDragStylesEnabledRef}
        onChange={onChange}
      />
    </DragAndDropItem>
  );
}

// Have to split the component into two because the stlyes and selected styles need to be on the animated view, but
// the changing of styles requires a rerender, which if everything were above would cause the animation to reset,
// making the bubble jump back to its original position instead of sliding back.
// It's annoying but it's what works.

type SlideableBubbleProps = {
  taskName: string;
  id: number;
  activeDay: number;
  entries: any[];
  startDragRef: React.MutableRefObject<() => void>;
  cancelDragRef: React.MutableRefObject<() => void>;
  dragOngoingRef: React.MutableRefObject<boolean>;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStylesEnabledRef: React.MutableRefObject<(enabled: boolean) => void>;
  onChange: () => void;
};

function SlideableBubble({
  taskName,
  id,
  activeDay,
  entries,
  startDragRef,
  cancelDragRef,
  dragOngoingRef,
  setScrollEnabled,
  setDragStylesEnabledRef,
  onChange,
}: SlideableBubbleProps) {
  // DB
  const db = useDatabase();
  // Sliding
  const slideOffset = useRef(new Animated.Value(0)).current;
  const slideEnabled = useRef(true);
  const [taskOpen, setTaskOpen] = useState(false);
  const taskLengthRef = useRef(0);
  // Info modal
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const infoChangeOpenStateRef = useRef<
    (
      level: "half" | "full" | "closed",
      callback?: (() => void) | undefined,
      override_timing?: number | undefined
    ) => void
  >(() => {});
  const longPressDetectedRef = useRef(false);
  // Dragging styles
  const [dragStylesEnabled, setDragStylesEnabled] = useState(false);
  setDragStylesEnabledRef.current = (enabled: boolean) =>
    setDragStylesEnabled(enabled);

  // Utils
  const hideTask = () => {
    db.transaction((tx) => {
      tx.executeSql(`UPDATE tasks SET hidden = ? WHERE id = ?;`, [
        getToday(),
        id,
      ]);
    });
    onChange();
  };

  const setEntry = (date: number, value: number) => {
    // Update in the DB
    db.transaction((tx) => {
      tx.executeSql(
        `INSERT OR REPLACE INTO entries (task_id, date, value) VALUES (?, ?, ?);`,
        [id, date, value]
      );
    });
    // Update here too so the UI updates immediately
    // TODO
    // Close or hide the task, depending on the user's settings
    if (!HIDE_ON_SET) {
      setTaskOpen(false);
      Animated.spring(slideOffset, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideOffset, {
        toValue:
          OPEN_POSITION - taskLengthRef.current * 2 - HIDDEN_POSITION_OFFSET,
        duration: HIDE_DURATION,
        useNativeDriver: true,
      }).start(hideTask);
    }
    onChange();
  };

  // Pan responder handlers
  const makePanResponderMoveHandler = () => {
    return (
      _: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      // Calculate position
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

      const max_distance = 400;
      const inertia = 100;
      const sign = Math.sign(gestureState.dx);
      const x = Math.abs(gestureState.dx);
      const offset = max_distance * sigmoid(x / inertia) - max_distance / 2;

      Animated.event([{ dx: slideOffset }], {
        useNativeDriver: false,
      })({ dx: sign * offset + (taskOpen ? OPEN_POSITION : 0) });
    };
  };

  const makePanResponderEndHandler = () => {
    return (
      _: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      if (!taskOpen) {
        // Just hide the task
        if (gestureState.dx <= HIDE_THRESHOLD) {
          Animated.timing(slideOffset, {
            toValue:
              gestureState.dx -
              taskLengthRef.current * 2 -
              HIDDEN_POSITION_OFFSET,
            duration: HIDE_DURATION,
            useNativeDriver: true,
          }).start(hideTask);
          return;
        }

        // Open the task
        if (gestureState.dx >= OPEN_THRESHOLD) {
          Animated.spring(slideOffset, {
            toValue: OPEN_POSITION,
            useNativeDriver: true,
          }).start();
          setTaskOpen(true);
          return;
        }

        // Return to neutral
        Animated.spring(slideOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      } else {
        // Close the task
        if (gestureState.dx <= CLOSE_THRESHOLD) {
          Animated.spring(slideOffset, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
          setTaskOpen(false);
          return;
        }

        // Return to open
        Animated.spring(slideOffset, {
          toValue: OPEN_POSITION,
          useNativeDriver: true,
        }).start();
        return;
      }

      setScrollEnabled(true);
    };
  };

  // Initialize the above
  const panResponderMoveHandlerRef = useRef(makePanResponderMoveHandler());
  const panResponderEndHandlerRef = useRef(makePanResponderEndHandler());
  // Keep them up to date
  useEffect(() => {
    panResponderMoveHandlerRef.current = makePanResponderMoveHandler();
    panResponderEndHandlerRef.current = makePanResponderEndHandler();
  }, [taskOpen]);

  // Make the panresponder
  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && slideEnabled.current;
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },
      onPanResponderMove: (e, g) => panResponderMoveHandlerRef.current(e, g),
      onPanResponderEnd: (e, g) => panResponderEndHandlerRef.current(e, g),
    })
  );

  return (
    <>
      <DragUpMenuModal
        visible={infoModalVisible}
        onClose={() => {
          setInfoModalVisible(false);
          setDragStylesEnabled(false);
        }}
        changeOpenStateRef={infoChangeOpenStateRef}
      >
        {}
      </DragUpMenuModal>
      <View
        style={{ flex: 1 }}
        onLayout={(e) => (taskLengthRef.current = e.nativeEvent.layout.width)}
      >
        {/* Background Buttons */}
        <View style={styles.backgroundButtonsContainer}>
          {/* Left side*/}
          <View style={styles.backgroundButtonsContainerLeft}>
            <BackgroundButton
              name="Empty"
              icon={CIRCLE_EMPTY}
              textColor={colors.grey}
              iconColor={colors.away_grey}
              opacity={slideOffset}
              onPress={() => {
                setEntry(activeDay, 0);
              }}
            />
            <BackgroundButton
              name="Half"
              icon={CIRCLE_HALF}
              textColor={colors.white}
              iconColor={colors.blue}
              opacity={slideOffset}
              onPress={() => {
                setEntry(activeDay, 1);
              }}
            />
            <BackgroundButton
              name="Full"
              icon={CIRCLE_FULL}
              textColor={colors.white}
              iconColor={colors.blue}
              opacity={slideOffset}
              onPress={() => {
                setEntry(activeDay, 2);
              }}
            />
          </View>
          {/* Right side */}
          <BackgroundButton
            name="Hide"
            icon={CLOSE_ICON}
            opacity={Animated.divide(Animated.add(slideOffset, 700), 600)}
            textColor={colors.grey}
            iconColor={colors.grey}
          />
        </View>
        {/* Slideable foreground */}
        <Animated.View
          style={[
            styles.taskContainer,
            dragStylesEnabled ? styles.taskContainerSelected : {},
            { transform: [{ translateX: slideOffset }] },
          ]}
          {...panResponderRef.current.panHandlers}
        >
          <TouchableWithoutFeedback
            style={{ flex: 1 }}
            onLongPress={() => {
              setDragStylesEnabled(true);
              startDragRef.current();
              Vibration.vibrate(10);
              slideEnabled.current = false;
              dragOngoingRef.current = false;
              longPressDetectedRef.current = true;
            }}
            onPressOut={() => {
              if (!longPressDetectedRef.current) return;
              longPressDetectedRef.current = false;
              if (dragOngoingRef.current) return;
              cancelDragRef.current();
              slideEnabled.current = true;
              setInfoModalVisible(true);
              infoChangeOpenStateRef.current("half");
            }}
          >
            <View style={styles.taskContent}>
              <Text style={styles.taskName}>{taskName}</Text>
              <View style={styles.entriesContainer}>
                {Array.from({ length: 7 }, (_, i) => {
                  const date = getDaysBack(i);
                  const entry = entries.filter(
                    (entry) => entry.date === date
                  )[0];
                  const entryValue = entry !== undefined ? entry.value : 0;
                  return <Entry entryValue={entryValue} key={date} />;
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </View>
    </>
  );
}

type EntryProps = {
  entryValue: number;
};

function Entry({ entryValue }: EntryProps) {
  const entry: "empty" | "half" | "full" =
    entryValue === 0 ? "empty" : entryValue === 1 ? "half" : "full";

  return (
    <Image
      source={
        entry === "empty"
          ? CIRCLE_EMPTY
          : entry === "half"
          ? CIRCLE_HALF
          : CIRCLE_FULL
      }
      style={[
        styles.entry,
        { tintColor: entry !== "empty" ? colors.blue : colors.away_grey },
      ]}
    ></Image>
  );
}

type BackgroundButtonProps = {
  name: string;
  icon: any;
  textColor: string;
  iconColor: string;
  opacity: Animated.AnimatedInterpolation<number>;
  onPress?: () => void;
};

function BackgroundButton({
  name,
  icon,
  opacity,
  textColor,
  iconColor,
  onPress,
}: BackgroundButtonProps) {
  return (
    <View style={styles.backgroundButtonBorder}>
      <TouchableNativeFeedback
        onPress={onPress !== undefined ? onPress : () => {}}
        background={
          onPress !== undefined
            ? undefined
            : TouchableNativeFeedback.Ripple("#00000000", false)
        }
      >
        <Animated.View style={[styles.backgroundButton, { opacity: opacity }]}>
          <Image
            source={icon}
            style={[styles.backgroundButtonIcon, { tintColor: iconColor }]}
          />
          <Text style={[styles.backgroundButtonText, { color: textColor }]}>
            {name}
          </Text>
        </Animated.View>
      </TouchableNativeFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  taskContainer: {
    width: "100%",
    height: 45,
    backgroundColor: colors.bubble_grey,
    borderRadius: 500000,
    zIndex: 1,
  },
  taskContainerSelected: {
    backgroundColor: colors.bubble_highlighted_grey,
    zIndex: 1,
  },
  taskContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 22,
  },
  taskName: {
    fontFamily: "notoSansRegular",
    fontSize: 12,
    color: colors.white,
    bottom: 1,
    width: "34%",
    zIndex: -1,
  },

  entriesContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 15,
  },
  entry: {
    width: 24,
    height: 24,
    tintColor: colors.away_grey,
  },

  backgroundButtonsContainer: {
    position: "absolute",
    height: "100%",
    width: "100%",
    paddingLeft: 10,
    paddingRight: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backgroundButtonsContainerLeft: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    gap: 5,
  },
  backgroundButtonBorder: {
    overflow: "hidden",
    width: 75,
    height: 45,
    borderRadius: 500000,
    justifyContent: "center",
    alignItems: "center",
  },
  backgroundButton: {
    paddingTop: 4,
    width: "100%",
    height: "100%",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: -5,
  },
  backgroundButtonIcon: {
    width: 24,
    height: 24,
    margin: 0,
    padding: 0,
  },
  backgroundButtonText: {
    fontFamily: "notoSansRegular",
    fontSize: 12,
    margin: 0,
    padding: 0,
  },
});
