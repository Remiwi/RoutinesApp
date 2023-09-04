import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { useTaskContext } from "../../screens/Tasks/TaskContext";
import { colors } from "../../variables";

import JustDate from "../../JustDate";
import { BottomTabBarHeightCallbackContext } from "@react-navigation/bottom-tabs";

const [FULL, HALF, NONE] = [2, 1, 0];

const SQUIRCLE_EMPTY = require("../../assets/icons/squircle_empty.png");
const SQUIRCLE_HALF = require("../../assets/icons/squircle_half.png");
const SQUIRCLE_FULL = require("../../assets/icons/squircle_full.png");

type CalendarProps = {
  date: JustDate;

  editing: number;
  editingEnabled?: boolean;
  onEdit?: (date: JustDate, value: number) => void;
};

export default function Calendar({
  date,
  editing,
  editingEnabled,
  onEdit,
}: CalendarProps) {
  const taskCtx = useTaskContext();

  if (editingEnabled === undefined) editingEnabled = false;

  const month = date.getMonth();
  const start = date.shiftToMonthStart().shiftToWeekStart();
  const boxData: {
    date: JustDate;
    visible: boolean;
  }[] = JustDate.getAllDaysBetween(start, start.shiftDays(7 * 6)).map(
    (date) => {
      return {
        date: date,
        visible: date.getMonth() === month,
      };
    }
  );

  return (
    <View style={styles.calendar_row_container}>
      <View style={styles.calendar_row}>
        <Text style={styles.day_text}>SUN</Text>
        <Text style={styles.day_text}>MON</Text>
        <Text style={styles.day_text}>TUE</Text>
        <Text style={styles.day_text}>WED</Text>
        <Text style={styles.day_text}>THU</Text>
        <Text style={styles.day_text}>FRI</Text>
        <Text style={styles.day_text}>SAT</Text>
      </View>
      {Array.from({ length: 6 }, (_, i) => (
        <View style={styles.calendar_row} key={i}>
          {boxData.slice(i * 7, (i + 1) * 7).map((box, idx) => {
            const val = taskCtx.getEntry(box.date);
            return (
              <CalendarBox
                date={box.date}
                visible={box.visible}
                value={val}
                onPress={() => {
                  if (
                    !editingEnabled ||
                    onEdit === undefined ||
                    box.date.isAfter(JustDate.today())
                  )
                    return;
                  onEdit(box.date, editing);
                }}
                iconTint={val === NONE ? colors.away_grey : colors.blue}
                textColor={val === NONE ? colors.grey : colors.bubble_grey}
                key={idx}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

type CalendarBoxProps = {
  date: JustDate;
  value: number;
  onPress?: () => void;
  visible?: boolean;
  iconTint?: string;
  textColor?: string;
};

function CalendarBox({
  date,
  value,
  onPress,
  visible,
  iconTint,
  textColor,
}: CalendarBoxProps) {
  const icon =
    value === FULL
      ? SQUIRCLE_FULL
      : value === HALF
      ? SQUIRCLE_HALF
      : SQUIRCLE_EMPTY;
  if (onPress === undefined || visible === false) onPress = () => {};
  if (iconTint === undefined) iconTint = colors.away_grey;
  if (textColor === undefined) textColor = colors.grey;

  const text = date.getDay().toString();

  return (
    <TouchableWithoutFeedback onPress={onPress}>
      <View style={styles.box_container}>
        <Image
          source={icon}
          style={[
            styles.box_image,
            { tintColor: visible ? iconTint : "#00000000" },
          ]}
        ></Image>
        <Text
          style={[
            styles.box_text,
            {
              color: visible ? textColor : "#00000000",
              paddingLeft: value === NONE ? 6 : 5,
              top: value === NONE ? 0 : -1,
            },
          ]}
        >
          {text}
          {/*
          Invisible extra character if the text is one character instead of two
          For some reason if the text isn't two characters then the box gets bigger??? This is a hacky solution but it works and I want to move on
        */}
          <Text
            style={[
              styles.box_text,
              {
                color: "#00000000",
                paddingLeft: 0,
              },
            ]}
          >
            {text.length === 1 ? "0" : ""}
          </Text>
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  calendar_row_container: {
    width: "100%",
    gap: 8,
  },
  calendar_row: {
    flexGrow: 1,
    flexDirection: "row",
    gap: 8,
  },
  day_text: {
    width: 37.5,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "notoSansRegular",
    color: colors.grey,
  },

  box_container: {
    flexGrow: 1,
    aspectRatio: 1,
  },
  box_image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  box_text: {
    paddingLeft: 6,
    fontSize: 14,
    fontFamily: "notoSansRegular",
  },
});
