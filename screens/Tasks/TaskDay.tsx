import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  ToastAndroid,
} from "react-native";
import { colors } from "../../variables";

type DayProps = {
  days_back: number;
  active: boolean;
  onLongPress: () => void;
};

export default function Day({ days_back, active, onLongPress }: DayProps) {
  const day = new Date();
  day.setDate(day.getDate() - days_back);

  const dayofweek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][
    day.getDay()
  ];
  const dayofmonth = day.getDate();

  return (
    <TouchableWithoutFeedback
      onPress={() =>
        ToastAndroid.show("Press and hold to select a day", ToastAndroid.SHORT)
      }
      onLongPress={onLongPress}
    >
      <View style={styles.day}>
        <Text
          style={[
            styles.dayText,
            { color: active ? colors.white : colors.grey },
          ]}
        >
          {dayofweek}
        </Text>
        <Text
          style={[
            styles.dayText,
            { color: active ? colors.white : colors.grey },
          ]}
        >
          {dayofmonth}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  daysContainer: {
    width: "100%",
    paddingTop: 5,
    paddingLeft: 27,
    paddingRight: 20,
    marginBottom: 5,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  days: {
    width: "64%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: {
    fontFamily: "notoSansRegular",
    fontSize: 12,
    color: colors.grey,
    fontWeight: "bold",
  },
});
