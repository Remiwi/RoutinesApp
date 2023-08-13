import React, { createContext, useContext, useRef } from 'react';

type DragAndDropListener = (startIndex: number, prevIndex: number, currentIndex: number) => void;

type DragAndDropData = {
  scrollEnabled: boolean;
  setScrollEnabled: React.Dispatch<React.SetStateAction<boolean>>; 
  orderedIDs: React.MutableRefObject<any[]>;

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
  const [scrollEnabled, setScrollEnabled] = React.useState<boolean>(true);
  const orderedIDs = useRef([]);

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
      orderedIDs: orderedIDs,

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