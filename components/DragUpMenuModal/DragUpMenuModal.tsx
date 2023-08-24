import {
  StyleSheet,
  View,
  Animated,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from "react-native";
import { useState, useRef, useEffect } from "react";
import { colors } from "../../variables";

const EXTRA_HEIGHT = 50;
const EXTRA_RATE = 0.01;
const OPEN_HEIGHT = 500;
const PEEK_HEIGHT = 150;
const GRAB_SIZE = 25;
const STATE_ANIMATION_TIME = 200;
const STATE_TRANSITION_THRESHOLD = 10;

type DragUpMenuModalProps = {
  visible: boolean;
  changeOpenStateRef: React.MutableRefObject<
    (
      level: "full" | "half" | "closed",
      callback?: () => void,
      override_timing?: number
    ) => void
  >;
  onClose: () => void;

  children?: React.ReactNode;
};

export default function DragUpMenuModal({
  visible,
  changeOpenStateRef,
  onClose,
  children,
}: DragUpMenuModalProps) {
  const [openState, setOpenState] = useState<"closed" | "half" | "full">(
    "closed"
  );
  const isGrabbableRef = useRef(true);
  const height = useRef(
    new Animated.Value(2 * OPEN_HEIGHT - PEEK_HEIGHT)
  ).current;

  // Setup animation refs
  changeOpenStateRef.current = (level, callback, override_timing) => {
    if (override_timing === undefined) override_timing = STATE_ANIMATION_TIME;

    if (level === "full")
      Animated.timing(height, {
        toValue: 0,
        duration: override_timing,
        useNativeDriver: true,
      }).start(() => {
        if (callback) callback();
        isGrabbableRef.current = true;
        setOpenState("full");
      });
    else if (level === "half")
      Animated.timing(height, {
        toValue: OPEN_HEIGHT - PEEK_HEIGHT,
        duration: override_timing,
        useNativeDriver: true,
      }).start(() => {
        if (callback) callback();
        isGrabbableRef.current = true;
        setOpenState("half");
      });
    else if (level === "closed")
      Animated.timing(height, {
        toValue: 2 * OPEN_HEIGHT - PEEK_HEIGHT,
        duration: override_timing,
        useNativeDriver: true,
      }).start(() => {
        if (callback) callback();
        isGrabbableRef.current = true;
        setOpenState("closed");
      });
  };

  // Reset state values whenever it goes invisible
  useEffect(() => {
    if (visible) return;
    setOpenState("closed");
    height.setValue(2 * OPEN_HEIGHT - PEEK_HEIGHT);
  }, [visible]);

  // Pan responder methods
  const makePanResponderMoveHandler = () => {
    return (
      event: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

      if (openState === "full") {
        let newHeight = gestureState.dy;
        if (newHeight < 0) {
          newHeight =
            (sigmoid(newHeight * EXTRA_RATE) - 1) * EXTRA_HEIGHT +
            EXTRA_HEIGHT / 2;
        }
        height.setValue(newHeight);
      }
      if (openState === "half") {
        height.setValue(OPEN_HEIGHT - PEEK_HEIGHT + gestureState.dy);
      }
    };
  };

  const makePanResponderEndHandler = () => {
    return (
      event: GestureResponderEvent,
      gestureState: PanResponderGestureState
    ) => {
      // Don't allow grabbing until the animation ends
      isGrabbableRef.current = false;

      // If open and dragged down, go to peeking
      if (
        (openState === "full" &&
          gestureState.dy > STATE_TRANSITION_THRESHOLD) ||
        (openState === "half" &&
          gestureState.dy >= -STATE_TRANSITION_THRESHOLD) ||
        (openState === "half" && gestureState.dy <= STATE_TRANSITION_THRESHOLD)
      ) {
        changeOpenStateRef.current("half");
      }
      if (
        (openState === "half" &&
          gestureState.dy < -STATE_TRANSITION_THRESHOLD) ||
        (openState === "full" && gestureState.dy <= STATE_TRANSITION_THRESHOLD)
      ) {
        changeOpenStateRef.current("full");
      }
      if (
        openState === "half" &&
        gestureState.dy > STATE_TRANSITION_THRESHOLD
      ) {
        changeOpenStateRef.current("closed", onClose);
      }
    };
  };

  // Initialize pan responder methods
  const panResponderMoveHandler = useRef(makePanResponderMoveHandler());
  const panResponderEndHandler = useRef(makePanResponderEndHandler());
  // Keep pan responder methods up to date
  useEffect(() => {
    panResponderMoveHandler.current = makePanResponderMoveHandler();
    panResponderEndHandler.current = makePanResponderEndHandler();
  }, [openState]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => {
        return isGrabbableRef.current;
      },
      onPanResponderMove: (e, gestureState) => {
        panResponderMoveHandler.current(e, gestureState);
      },
      onPanResponderEnd: (e, gestureState) => {
        panResponderEndHandler.current(e, gestureState);
      },
    })
  ).current;

  return (
    <Modal transparent visible={visible}>
      <View style={styles.background}>
        <TouchableWithoutFeedback
          onPress={() => changeOpenStateRef.current("closed", onClose)}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              width: "100%",
              height: 100000,
              transform: [
                { translateY: Animated.add(height, EXTRA_HEIGHT - 10) },
              ],
            }}
          ></Animated.View>
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.container,
            { height: OPEN_HEIGHT + EXTRA_HEIGHT },
            {
              transform: [{ translateY: Animated.add(height, EXTRA_HEIGHT) }],
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.grabBar}>
            <View style={styles.grabBarIcon}></View>
          </View>
          <ScrollView
            style={[styles.scrollView, { maxHeight: OPEN_HEIGHT - GRAB_SIZE }]}
            scrollEnabled={openState === "full"}
          >
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "flex-end",
    flexDirection: "column",
    alignItems: "center",
  },
  container: {
    width: "100%",
    backgroundColor: colors.nav_grey,
    borderWidth: 1,
    borderColor: colors.grey,
    borderRadius: GRAB_SIZE,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  grabBar: {
    width: "100%",
    height: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  grabBarIcon: {
    width: 42,
    height: 5,
    borderRadius: 500000,
    backgroundColor: colors.away_grey,
  },
  scrollView: {
    marginLeft: 25,
    marginRight: 25,
    flex: 1,
  },
});
