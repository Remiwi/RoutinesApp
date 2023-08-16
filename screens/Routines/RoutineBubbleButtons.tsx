import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableNativeFeedback,
  TouchableWithoutFeedback,
  LayoutAnimation,
  PanResponder,
  Animated,
} from "react-native";
import { colors } from "../../variables";

type ButtonProps = {
  label: string;
  icon: any;
  color: string;
  style: any;
  onPress?: () => void;
};

export function Button({ label, icon, color, style, onPress }: ButtonProps) {
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

type ExtraButtonProps = {
  label: string;
  icon: any;
  onPress: () => void;
};

export function ExtraButton({ label, icon, onPress }: ExtraButtonProps) {
  return (
    <TouchableNativeFeedback onPress={onPress}>
      <View style={styles.extraButton}>
        <Image source={icon} style={styles.extraButtonIcon}></Image>
        <Text style={styles.extraButtonLabel}>{label}</Text>
      </View>
    </TouchableNativeFeedback>
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

  extraButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 10,
    paddingTop: 7,
    paddingBottom: 7,
  },
  extraButtonIcon: {
    tintColor: colors.white,
    width: 22,
    height: 22,
  },
  extraButtonLabel: {
    color: colors.white,
    fontSize: 16,
    fontFamily: "notoSansRegular",
    paddingBottom: 2,
  },
});
