import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableNativeFeedback,
} from "react-native";
import { colors } from "../../variables";

type ButtonProps = {
  label: string;
  icon: any;
  color: string;
  style: any;
  onPress?: () => void;
};

export default function Button({
  label,
  icon,
  color,
  style,
  onPress,
}: ButtonProps) {
  return (
    <View style={style}>
      <View style={[styles.button, { overflow: "hidden" }]}>
        <TouchableNativeFeedback
          onPress={onPress !== undefined ? onPress : () => {}}
        >
          <View style={[styles.button, { backgroundColor: color }]}>
            <Image source={icon} style={styles.open_icon}></Image>
          </View>
        </TouchableNativeFeedback>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 500000,
    width: 80,
    height: 80,
    backgroundColor: colors.grey,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    color: colors.grey,
    fontSize: 14,
    fontFamily: "notoSansRegular",
    paddingTop: 6,
    paddingBottom: 2,
  },
  hide_icon: {
    width: 24,
    height: 24,
    tintColor: colors.bubble_grey,
  },
  open_icon: {
    width: 28,
    height: 28,
    tintColor: colors.bubble_grey,
  },
});
