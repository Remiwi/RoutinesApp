import React, { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Vibration,
  Animated,
  PanResponder,
  TouchableWithoutFeedback,
} from "react-native";
import { colors } from "../../variables";

import { DragAndDropItem } from "../../components/DragAndDrop/DragAndDrop";

const CIRCLE_EMPTY = require("../../assets/icons/circle_empty.png");
const CIRCLE_HALF = require("../../assets/icons/circle_half.png");
const CIRCLE_FULL = require("../../assets/icons/circle_full.png");

type TaskBubbleProps = {
  taskName: string;
  index: number;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  onDragFinished: (startIndex: number, endIndex: number) => void;
};

export default function TaskBubble({
  taskName,
  index,
  setScrollEnabled,
  onDragFinished,
}: TaskBubbleProps) {
  // Drag and Drop
  const startDragRef = useRef<() => void>(() => {});
  const dragOngoingRef = useRef(false);
  const setDragStylesEnabledRef = useRef<(enabled: boolean) => void>(() => {});

  return (
    <DragAndDropItem
      itemIndex={index}
      startDragRef={startDragRef}
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
        startDragRef={startDragRef}
        dragOngoingRef={dragOngoingRef}
        setScrollEnabled={setScrollEnabled}
        setDragStylesEnabledRef={setDragStylesEnabledRef}
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
  startDragRef: React.MutableRefObject<() => void>;
  dragOngoingRef: React.MutableRefObject<boolean>;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setDragStylesEnabledRef: React.MutableRefObject<(enabled: boolean) => void>;
};

function SlideableBubble({
  taskName,
  startDragRef,
  dragOngoingRef,
  setScrollEnabled,
  setDragStylesEnabledRef,
}: SlideableBubbleProps) {
  // Sliding
  const slideOffset: Animated.Value = useRef(new Animated.Value(0)).current;
  const slideEnabled = useRef(true);
  // Dragging styles
  const [dragStylesEnabled, setDragStylesEnabled] = useState(false);
  setDragStylesEnabledRef.current = (enabled: boolean) =>
    setDragStylesEnabled(enabled);

  const panResponderRef = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 20 && slideEnabled.current;
      },
      onPanResponderGrant: () => {
        setScrollEnabled(false);
      },
      onPanResponderMove: Animated.event([null, { dx: slideOffset }], {
        useNativeDriver: false,
      }),
      onPanResponderEnd: () => {
        Animated.spring(slideOffset, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
        setScrollEnabled(true);
      },
    })
  );

  return (
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
        }}
        onPressOut={() => {
          if (dragOngoingRef.current) return;
          slideEnabled.current = true;
          setDragStylesEnabled(false);
        }}
      >
        <View style={styles.taskContent}>
          <Text style={styles.taskName}>{taskName}</Text>
          <View style={styles.entriesContainer}>
            <Entry entry={"full"} />
            <Entry entry={"half"} />
            <Entry entry={"empty"} />
            <Entry entry={"empty"} />
            <Entry entry={"empty"} />
            <Entry entry={"empty"} />
            <Entry entry={"empty"} />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
}

type EntryProps = {
  entry: "empty" | "half" | "full";
};

function Entry({ entry }: EntryProps) {
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

const styles = StyleSheet.create({
  taskContainer: {
    width: "100%",
    height: 50,
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
});
