import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableWithoutFeedback,
} from "react-native";
import { useTaskContext } from "../../screens/Tasks/TaskContext";
import { colors } from "../../variables";

import { intToDateUTC, getToday, getIntDate, intToDateLocal } from "../../date";

const [FULL, HALF, NONE] = [2, 1, 0];

const SQUIRCLE_EMPTY = require("../../assets/icons/squircle_empty.png");
const SQUIRCLE_HALF = require("../../assets/icons/squircle_half.png");
const SQUIRCLE_FULL = require("../../assets/icons/squircle_full.png");

type CalendarProps = {
  month: number;
  year: number;

  editing: number;
  editingEnabled?: boolean;
  onEdit?: (date: number, value: number) => void;
};

export default function Calendar({
  month,
  year,
  editing,
  editingEnabled,
  onEdit,
}: CalendarProps) {
  const taskCtx = useTaskContext();

  if (editingEnabled === undefined) editingEnabled = false;

  const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30][month];
  const firstOfMonthInt = getIntDate(new Date(year, month, 1));
  const firstDay = intToDateUTC(firstOfMonthInt).getDay();

  const boxData: {
    date: number;
    visible: boolean;
  }[] = [];
  for (let i = -firstDay; i < 7 * 6 - firstDay; i++) {
    if (i < 0 || i > daysInMonth - 1)
      boxData.push({
        date: -1,
        visible: false,
      });
    else {
      boxData.push({
        date: firstOfMonthInt + i,
        visible: true,
      });
    }
  }

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
            const val = taskCtx.entries.get(box.date) ?? NONE;
            return (
              <CalendarBox
                date={box.date !== -1 ? box.date : 0}
                visible={box.visible}
                value={val}
                onPress={() => {
                  if (
                    !editingEnabled ||
                    onEdit === undefined ||
                    box.date > getToday()
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
  date: number;
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

  const text = intToDateLocal(date).getDate().toString();

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
