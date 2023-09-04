import {
  Text,
  View,
  Image,
  TouchableNativeFeedback,
  StyleSheet,
} from "react-native";
import { colors } from "../../variables";

type ExtraButtonProps = {
  label: string;
  icon: any;
  onPress: () => void;
  color?: string;
};

export default function ExtraButton({
  label,
  icon,
  onPress,
  color,
}: ExtraButtonProps) {
  return (
    <View style={{ overflow: "hidden", borderRadius: 500000 }}>
      <TouchableNativeFeedback onPress={onPress}>
        <View style={styles.extraButton}>
          <Image
            source={icon}
            style={[
              styles.extraButtonIcon,
              color === undefined ? {} : { tintColor: color },
            ]}
          ></Image>
          <Text
            style={[
              styles.extraButtonLabel,
              color === undefined ? {} : { color: color },
            ]}
          >
            {label}
          </Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  extraButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 18,
    padding: 10,
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 100000,
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
    paddingBottom: 4,
  },
});
