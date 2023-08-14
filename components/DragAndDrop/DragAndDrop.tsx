import React, { createContext, useContext, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';

type DragAndDropListener = (startIndex: number, prevIndex: number, currentIndex: number) => void;

type DragAndDropData = {
  scrollEnabled: boolean;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  scrollRef: React.MutableRefObject<ScrollView|null>;
  orderedIDs: React.MutableRefObject<any[]>;

  scrollHeight: React.MutableRefObject<number>;
  maxScrollHeight: React.MutableRefObject<number>;
  updateEdgeScrolling: (y: number) => void;
  touchHeightStart: React.MutableRefObject<number>;

  startIndex: React.MutableRefObject<number | null>;
  prevIndex: React.MutableRefObject<number | null>;
  currentIndex: React.MutableRefObject<number | null>;
  
  addListener: (listener: DragAndDropListener) => number;
  removeListener: (id: number) => void;
  notifyListeners: () => void;

  bubbleHeight: React.MutableRefObject<number>;
};

const DragAndDropContext = createContext<DragAndDropData | null>(null);

export function DragAndDropProvider({ children }: any) {
  const orderedIDs = useRef([]);
  const [scrollEnabled, setScrollEnabled] = React.useState<boolean>(true);
  const scrollRef = useRef<ScrollView>(null);

  const scrollDir = useRef<number>(0);
  const scrollHeight = useRef<number>(0);
  const maxScrollHeight = useRef<number>(500);
  const touchHeightStart = useRef<number>(0);
  const updateEdgeScrolling = (y: number) => {
    const speed = 8;
    if (y <= 100) {
      scrollDir.current = -speed;
    }
    else if (y >= 650) {
      scrollDir.current = speed;
    }
    else {
      scrollDir.current = 0
    }
  };

  useEffect(() => {
    const scrollByDir = () => {
      if (scrollDir.current !== 0) {
        const newScrollHeight = Math.min(maxScrollHeight.current, Math.max(0, scrollHeight.current + scrollDir.current)); // Keep scrollHeight within bounds
        scrollHeight.current = newScrollHeight; // We update the scrollHeight reference here as well since ScrollView.onScroll isn't called as frequently. This makes animations smoother

        scrollRef.current?.scrollTo({y: newScrollHeight, animated: false}); // Actually move the ScrollView
      }
      requestAnimationFrame(scrollByDir);
    }
    scrollByDir();
  }, []);
  

  const startIndex = useRef<number | null>(null);
  const prevIndex = useRef<number | null>(null);
  const currentIndex = useRef<number | null>(null);

  const listeners = useRef<{callback: DragAndDropListener, id: number}[]>([]);
  const nextListenerID = useRef<number>(0);

  const addListener = (listener: DragAndDropListener) => {
    listeners.current.push({callback: listener, id: nextListenerID.current});
    nextListenerID.current += 1;
    return nextListenerID.current - 1;
  };
  const removeListener = (id: number) => {
    listeners.current = listeners.current.filter((listener) => listener.id !== id);
  };
  const notifyListeners = () => {
    listeners.current.forEach(listener => listener.callback(startIndex.current!, prevIndex.current!, currentIndex.current!));
  };

  const bubbleHeight = useRef<number>(999999999999999999999999);
  
    

  return (
    <DragAndDropContext.Provider value={{
      scrollEnabled: scrollEnabled,
      setScrollEnabled: setScrollEnabled,
      scrollRef: scrollRef,
      orderedIDs: orderedIDs,

      updateEdgeScrolling: updateEdgeScrolling,
      scrollHeight: scrollHeight,
      maxScrollHeight: maxScrollHeight,

      touchHeightStart: touchHeightStart,
 
      startIndex: startIndex,
      prevIndex: prevIndex,
      currentIndex: currentIndex,
      
      addListener: addListener,
      removeListener: removeListener,
      notifyListeners: notifyListeners,

      bubbleHeight: bubbleHeight,
    }}>
      {children}
    </DragAndDropContext.Provider>
  );
}

export function useDragAndDrop() {
    const data = useContext(DragAndDropContext);
    if (!data) {
        throw new Error('useDragAndDrop must be used within a DragAndDropProvider');
    }
    return data;
}