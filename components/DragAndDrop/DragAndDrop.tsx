import { ScrollViewProps } from "react-native";
import { DragAndDropProvider } from "./DragAndDropContext";
import ContextlessDragAndDropScrollView from "./DragAndDropScrollView";
import DragAndDropItem from "./DragAndDropItem";

type DragAndDropScrollViewProps = ScrollViewProps & {
  upperDivingThreshold?: number;
  lowerDivingThreshold?: number;
  maxDivingSpeed?: number;
  evasionAnimationDuration?: number;
  droppingAnimationDuration?: number;
  itemGap?: number;
}

function DragAndDropScrollView({ upperDivingThreshold, lowerDivingThreshold, maxDivingSpeed, evasionAnimationDuration, droppingAnimationDuration, itemGap, ...props }: DragAndDropScrollViewProps) {
  return (
    <DragAndDropProvider
      upperDivingThreshold={upperDivingThreshold === undefined ? 150 : upperDivingThreshold}
      lowerDivingThreshold={lowerDivingThreshold === undefined ? 150 : lowerDivingThreshold}
      maxDivingSpeed={maxDivingSpeed === undefined ? 20 : maxDivingSpeed}
      evasionAnimationDuration={evasionAnimationDuration === undefined ? 200 : evasionAnimationDuration}
      droppingAnimationDuration={droppingAnimationDuration === undefined ? 200 : droppingAnimationDuration}
      itemGap={itemGap === undefined ? 0 : itemGap}
    >
      <ContextlessDragAndDropScrollView {...props}/>
    </DragAndDropProvider>
  );
}

export { DragAndDropItem, DragAndDropScrollView, DragAndDropScrollViewProps }