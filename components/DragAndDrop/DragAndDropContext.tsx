import React, { createContext, useContext, useRef, useEffect } from "react";
import { ScrollView, Dimensions } from "react-native";

type DragAndDropListener = (
  startIndex: number,
  prevIndex: number,
  currentIndex: number
) => void;

type DragAndDropData = {
  // Constants
  evasionAnimationDuration: number;
  droppingAnimationDuration: number;
  itemGap: number;

  // ScrollView
  scrollRef: React.MutableRefObject<ScrollView | null>;
  scrollEnabled: boolean;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  scrollViewHeight: React.MutableRefObject<number>;
  numItems: React.MutableRefObject<number>;

  // Scroll Depth
  scrollDepth: React.MutableRefObject<number>;
  maxScrollDepth: React.MutableRefObject<number>;
  updateEdgeDivingVelocity: (y: number | null) => void;

  // Dragging
  startIndex: React.MutableRefObject<number | null>;
  prevIndex: React.MutableRefObject<number | null>;
  currentIndex: React.MutableRefObject<number | null>;
  touchHeightStart: React.MutableRefObject<number>;
  draggedItemHeight: React.MutableRefObject<number>;

  // Dragged item index broadcast
  indexBroadcast: {
    addListener: (listener: DragAndDropListener) => number;
    removeListener: (id: number) => void;
    notifyListeners: () => void;
  };
};

const DragAndDropContext = createContext<DragAndDropData | null>(null);

type DragAndDropProviderProps = {
  upperDivingThreshold: number;
  lowerDivingThreshold: number;
  maxDivingSpeed: number;
  evasionAnimationDuration: number;
  droppingAnimationDuration: number;
  itemGap: number;

  children: React.ReactNode;
};

export function DragAndDropProvider(props: DragAndDropProviderProps) {
  // ScrollView Stuff
  const scrollRef = useRef<ScrollView>(null);
  const [scrollEnabled, setScrollEnabled] = React.useState<boolean>(true);
  const scrollViewHeight = useRef<number>(0);
  const numItems = useRef<number>(0);

  // Scroll Depth
  const scrollDepth = useRef<number>(0);
  const maxScrollDepth = useRef<number>(0);

  const screenHeight = useRef<number>(Dimensions.get("window").height);
  const scrollVelocity = useRef<number>(0);
  const updateEdgeDivingVelocity = (y: number | null) => {
    if (y === null) {
      scrollVelocity.current = 0;
      return;
    }

    if (y <= props.upperDivingThreshold) {
      const ratio = Math.min(
        (props.upperDivingThreshold - y) / props.upperDivingThreshold,
        1
      );
      scrollVelocity.current = -props.maxDivingSpeed * ratio;
    } else if (y >= screenHeight.current - props.lowerDivingThreshold) {
      const ratio = Math.min(
        (y - (screenHeight.current - props.lowerDivingThreshold)) /
          props.lowerDivingThreshold,
        1
      );
      scrollVelocity.current = props.maxDivingSpeed * ratio;
    } else {
      scrollVelocity.current = 0;
    }
  };

  const scrollByVelocityAnimationFrame = useRef<number | null>(null);
  useEffect(() => {
    const scrollByVelocity = () => {
      if (scrollVelocity.current !== 0) {
        const newScrollHeight = Math.max(
          0,
          Math.min(
            maxScrollDepth.current,
            scrollDepth.current + scrollVelocity.current
          )
        ); // Keep scrollHeight within bounds
        scrollDepth.current = newScrollHeight; // We update the scrollHeight reference here as well since ScrollView.onScroll isn't called as frequently. This makes animations smoother

        scrollRef.current?.scrollTo({ y: newScrollHeight, animated: false }); // Actually move the ScrollView
      }
      scrollByVelocityAnimationFrame.current =
        requestAnimationFrame(scrollByVelocity);
    };

    scrollByVelocityAnimationFrame.current =
      requestAnimationFrame(scrollByVelocity);

    return () => {
      if (scrollByVelocityAnimationFrame.current !== null)
        cancelAnimationFrame(scrollByVelocityAnimationFrame.current);
    };
  }, []);

  // Dragging
  const startIndex = useRef<number | null>(null);
  const prevIndex = useRef<number | null>(null);
  const currentIndex = useRef<number | null>(null);
  const touchHeightStart = useRef<number>(0);
  const draggedItemHeight = useRef<number>(0);

  // Dragged item index broadcast
  const listeners = useRef<{ callback: DragAndDropListener; id: number }[]>([]);
  const nextListenerID = useRef<number>(0);

  const addListener = (listener: DragAndDropListener) => {
    listeners.current.push({ callback: listener, id: nextListenerID.current });
    nextListenerID.current += 1;
    return nextListenerID.current - 1;
  };
  const removeListener = (id: number) => {
    listeners.current = listeners.current.filter(
      (listener) => listener.id !== id
    );
  };
  const notifyListeners = () => {
    listeners.current.forEach((listener) =>
      listener.callback(
        startIndex.current!,
        prevIndex.current!,
        currentIndex.current!
      )
    );
  };

  return (
    <DragAndDropContext.Provider
      value={{
        // Constants
        evasionAnimationDuration: props.evasionAnimationDuration,
        droppingAnimationDuration: props.droppingAnimationDuration,
        itemGap: props.itemGap,

        // ScrollView
        scrollRef: scrollRef,
        scrollEnabled: scrollEnabled,
        setScrollEnabled: setScrollEnabled,
        scrollViewHeight: scrollViewHeight,
        numItems: numItems,

        // Scroll Depth
        updateEdgeDivingVelocity: updateEdgeDivingVelocity,
        scrollDepth: scrollDepth,
        maxScrollDepth: maxScrollDepth,

        // Dragging
        startIndex: startIndex,
        prevIndex: prevIndex,
        currentIndex: currentIndex,
        touchHeightStart: touchHeightStart,
        draggedItemHeight: draggedItemHeight,

        // Dragged item index broadcast
        indexBroadcast: {
          addListener: addListener,
          removeListener: removeListener,
          notifyListeners: notifyListeners,
        },
      }}
    >
      {props.children}
    </DragAndDropContext.Provider>
  );
}

export function useDragAndDrop() {
  const data = useContext(DragAndDropContext);
  if (!data) {
    throw new Error("useDragAndDrop must be used within a DragAndDropProvider");
  }
  return data;
}
