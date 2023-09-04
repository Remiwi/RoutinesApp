import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableNativeFeedback,
} from "react-native";
import { colors } from "../../variables";
import JustDate from "../../JustDate";
import { useTaskContext } from "./TaskContext";

import DragUpMenuModal from "../../components/DragUpMenuModal/DragUpMenuModal";
import ExtraButton from "../../components/MenuButton/MenuButton";
import Calendar from "../../components/Calendar/Calendar";

const FREQUENCY_ICON = require("../../assets/icons/frequency.png");
const NOTIFICATION_ICON = require("../../assets/icons/bell.png");

const FULL_ICON = require("../../assets/icons/circle_full.png");
const HALF_ICON = require("../../assets/icons/circle_half.png");
const EMPTY_ICON = require("../../assets/icons/circle_empty.png");

const CHEVRON_LEFT = require("../../assets/icons/chevron_left.png");
const CHEVRON_RIGHT = require("../../assets/icons/chevron_right.png");

const NONE = -1;
const EMPTY = 0;
const HALF = 1;
const FULL = 2;

type TaskInfoProps = {
  visible: boolean;
  onClose: () => void;
  changeOpenStateRef: React.MutableRefObject<
    (
      level: "half" | "full" | "closed",
      callback?: (() => void) | undefined,
      override_timing?: number | undefined
    ) => void
  >;
};

export default function TaskInfo({
  visible,
  onClose,
  changeOpenStateRef,
}: TaskInfoProps) {
  const taskCtx = useTaskContext();
  const [selectedCalendarButton, setSelectedCalendarButton] = useState(NONE);
  const [calendarDate, setCalendarDate] = useState(
    JustDate.today().shiftToMonthStart()
  );

  const handleEditCalEntry = (date: JustDate, value: number) => {
    taskCtx.changeEntry(date, value);
  };

  return (
    <DragUpMenuModal
      visible={visible}
      onClose={onClose}
      changeOpenStateRef={changeOpenStateRef}
    >
      <Text style={styles.taskName}>{taskCtx.name}</Text>
      <View style={styles.content}>
        <ExtraButton
          label="Set frequency"
          icon={FREQUENCY_ICON}
          onPress={() => {}}
          color={colors.dim_grey}
        />
        <ExtraButton
          label="Add notification"
          icon={NOTIFICATION_ICON}
          onPress={() => {}}
          color={colors.dim_grey}
        />
      </View>
      <View style={styles.calendarContainer}>
        <CalendarMonthSelector date={calendarDate} setDate={setCalendarDate} />
        <Calendar
          date={calendarDate}
          editing={selectedCalendarButton}
          editingEnabled={selectedCalendarButton !== NONE}
          onEdit={handleEditCalEntry}
        />
        <View style={styles.calendarButtonContainer}>
          <CalendarButton
            onPress={() => {
              if (selectedCalendarButton !== EMPTY) {
                setSelectedCalendarButton(EMPTY);
              } else {
                setSelectedCalendarButton(NONE);
              }
            }}
            selected={selectedCalendarButton === EMPTY}
            icon={EMPTY_ICON}
            imageTintOverride={colors.grey}
          />
          <CalendarButton
            onPress={() => {
              if (selectedCalendarButton !== HALF) {
                setSelectedCalendarButton(HALF);
              } else {
                setSelectedCalendarButton(NONE);
              }
            }}
            selected={selectedCalendarButton === HALF}
            icon={HALF_ICON}
          />
          <CalendarButton
            onPress={() => {
              if (selectedCalendarButton !== FULL) {
                setSelectedCalendarButton(FULL);
              } else {
                setSelectedCalendarButton(NONE);
              }
            }}
            selected={selectedCalendarButton === FULL}
            icon={FULL_ICON}
          />
        </View>
      </View>
    </DragUpMenuModal>
  );
}

type CalendarMonthSelectorProps = {
  date: JustDate;
  setDate: (date: JustDate) => void;
};

function CalendarMonthSelector({ date, setDate }: CalendarMonthSelectorProps) {
  return (
    <View style={styles.calendarMonthSelector}>
      <View style={{ borderRadius: 500000 }}>
        <TouchableNativeFeedback
          onPress={() => {
            setDate(date.shiftToMonthStart().shiftMonths(-1));
          }}
        >
          <View style={styles.calendarMonthSelectorButton}>
            <Image
              source={CHEVRON_LEFT}
              style={[styles.calendarMonthSelectorButtonImage, { left: -1 }]}
            />
          </View>
        </TouchableNativeFeedback>
      </View>
      <Text style={styles.calendarMonthSelectorText}>
        {date.getMonthName() + " " + date.getYear().toString()}
      </Text>
      <View style={{ borderRadius: 500000 }}>
        <TouchableNativeFeedback
          onPress={() => {
            setDate(date.shiftToMonthStart().shiftMonths(1));
          }}
        >
          <View style={styles.calendarMonthSelectorButton}>
            <Image
              source={CHEVRON_RIGHT}
              style={[styles.calendarMonthSelectorButtonImage, { left: 1 }]}
            />
          </View>
        </TouchableNativeFeedback>
      </View>
    </View>
  );
}

type CalendarButtonProps = {
  onPress: () => void;
  selected: boolean;
  icon: any;
  imageTintOverride?: string;
};

function CalendarButton({
  onPress,
  selected,
  icon,
  imageTintOverride,
}: CalendarButtonProps) {
  if (imageTintOverride === undefined) imageTintOverride = colors.blue;

  return (
    <View style={{ borderRadius: 50000000 }}>
      <TouchableNativeFeedback onPress={onPress}>
        <View
          style={[
            styles.calendarButton,
            selected ? { backgroundColor: colors.button_grey } : {},
          ]}
        >
          <Image
            source={icon}
            style={[
              styles.calendarButtonImage,
              selected ? { tintColor: imageTintOverride } : {},
            ]}
          />
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  taskName: {
    paddingLeft: 20,
    marginBottom: 20,
    fontSize: 20,
    fontFamily: "notoSansRegular",
    color: colors.grey,
  },
  content: {
    gap: 5,
  },

  calendarContainer: {
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    backgroundColor: colors.bubble_grey,
    borderRadius: 16,
    paddingLeft: 35,
    paddingRight: 35,
  },

  calendarMonthSelector: {
    paddingTop: 2,
    paddingBottom: 10,
    width: "100%",
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  calendarMonthSelectorText: {
    fontSize: 20,
    fontFamily: "notoSansRegular",
    color: colors.white,
  },
  calendarMonthSelectorButton: {
    borderRadius: 50000000,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
    width: 75,
    top: 3,
  },
  calendarMonthSelectorButtonImage: {
    width: 25,
    height: 25,
    tintColor: colors.white,
  },

  calendarButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingTop: 10,
    paddingBottom: 10,
  },
  calendarButton: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 50000000,
    width: 100,
    backgroundColor: "transparent",
  },
  calendarButtonImage: {
    width: 30,
    height: 30,
    tintColor: colors.away_grey,
  },
});
