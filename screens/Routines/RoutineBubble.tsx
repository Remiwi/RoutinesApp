import { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableNativeFeedback, LayoutAnimation } from 'react-native';
import { useDatabase } from '../../database';
import { colors } from '../../variables';
import dateToInt from '../../date';

import TextInputModal from '../../components/TextInputModal/TextInputModal';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';

const OPEN_ICON = require("../../assets/icons/chevron_right.png");
const HIDE_ICON = require("../../assets/icons/close.png");

type RoutineBubbleProps = {
  name: string|null,
  id: number,
  position: number,
  onChange?: () => void,
  navigation: any,
}

export default function RoutineBubble({name, id, position, onChange, navigation}: RoutineBubbleProps) {
  const db = useDatabase();
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [currentName, setCurrentName] = useState<string|null>(name);
  const [expanded, setExpanded] = useState<boolean>(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState<boolean>(false);

  // Update name stuff
  const handleEditOpen = () => {
    setEditModalVisible(true);
  }

  const handleEditCancel = () => {
    setEditModalVisible(false);
  }

  const handleEditConfirm = (text: string) => {
    if (text == '') {
      handleEditCancel();
    } else {
      db.transaction((tx) => {
        tx.executeSql(
          `UPDATE routines SET name = ? WHERE id = ?;`,
          [text, id]
        );
      });
      setCurrentName(text);
      setEditModalVisible(false);
    }
  }

  // Delete routine stuff
  const handleDeleteOpen = () => {
    setDeleteModalVisible(true);
  }

  const handleDeleteCancel = () => {
    setDeleteModalVisible(false);
  }

  const handleDeleteConfirm = () => {
    db.transaction((tx) => {
      tx.executeSql(`DELETE FROM routines WHERE id = ?;`, [id]);
      tx.executeSql(`UPDATE routines SET position = position - 1 WHERE position > ?;`, [position]);
    });
    setDeleteModalVisible(false);
    if (onChange !== undefined) {
      onChange();
    }
  }

  // Hide routine
  const handleHide = () => {
    const today = dateToInt(new Date());
    db.transaction((tx) => {
      tx.executeSql(`UPDATE routines SET hidden = ? WHERE id = ?;`, [today, id]);
    })
    if (onChange !== undefined) {
      onChange();
    }
  }

  // Open routine
  const handleOpen = () => {
    navigation.navigate('Tasks', {routine_id: id, routine_name: currentName});
  }

  return (
    <>
    <TextInputModal
      visible={editModalVisible}
      msg='Routine Name'
      handleCancel={handleEditCancel}
      handleConfirm={handleEditConfirm}
    />

    <ConfirmModal
      visible={deleteModalVisible}
      msg='Are you sure you want to delete this routine? All tasks inside will be permanently deleted as well'
      handleCancel={handleDeleteCancel}
      handleConfirm={handleDeleteConfirm}
      confirmColor={colors.grey}
    />

    <View style={styles.container}>
      <View style={styles.mainContainer}>
        {/* Top*/}
        <View style={styles.top}>
          <TouchableNativeFeedback onPress={handleEditOpen}>
            <Text style={styles.title}>{currentName}</Text>
          </TouchableNativeFeedback>
          <View style={[styles.expand_button, {overflow: 'hidden'}]}>
            <TouchableNativeFeedback onPress={() => {
              LayoutAnimation.configureNext({
                duration: 70,
                update: {type: 'linear', property: 'scaleY', delay: 1},
                create: {type: 'linear', property: 'opacity', delay: 51, duration: 1},
                delete: {type: 'linear', property: 'opacity', duration: 1},
              });
              setExpanded(!expanded);
            }}>
              <View style={[styles.expand_button, {top: (expanded ? -1 : 1)}]}>
                <Image source={expanded ? require("../../assets/icons/chevron_up.png") : require("../../assets/icons/chevron_down.png")} style={styles.expand_icon}></Image>
              </View>
            </TouchableNativeFeedback>
          </View>
        </View>
        {/* Buttons */}
        <View style={styles.buttons_cotainer}>
          <View style={{flex: 1, alignItems: 'baseline'}}>
            <Button label={'Streak'} icon={null} color={colors.grey} style={{alignItems: 'center'}}></Button>
          </View>
          <Button
            label={'Hide'}
            icon={HIDE_ICON}
            color={colors.grey}
            style={{alignItems:'center'}}
            onPress={handleHide}
          />
          <Button
            label={'Open'}
            icon={OPEN_ICON}
            color={colors.blue}
            style={{alignItems:'center'}}
            onPress={handleOpen}
          />
        </View>
      </View>
      {/* Extra Buttons */
        expanded &&
        <View style={styles.extraButtons}>
          <ExtraButton label={'Delete'} icon={require("../../assets/icons/trash.png")} onPress={handleDeleteOpen}></ExtraButton>
        </View>
      }
    </View>
    </>
  )
}

type ButtonProps = {
  label: string,
  icon: any,
  color: string,
  style: any
  onPress?: () => void
}

function Button({label, icon, color, style, onPress}: ButtonProps) {
  return (
    <View style={style}>
      <View style={[styles.button, {overflow: 'hidden'}]}>
        <TouchableNativeFeedback
          onPress={onPress !== undefined ? onPress : () => {}}
        >
          <View style={[styles.button, {backgroundColor: color}]}>
            <Image source={icon} style={styles.open_icon}></Image>
          </View>
        </TouchableNativeFeedback>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

type ExtraButtonProps = {
  label: string,
  icon: any,
  onPress: () => void
}

function ExtraButton({label, icon, onPress}: ExtraButtonProps) {
  return (
    <TouchableNativeFeedback onPress={onPress}>
      <View style={styles.extraButtonContainer}>
        <Image source={icon} style={styles.extraButtonIcon}></Image>
        <Text style={styles.extraButtonLabel}>{label}</Text>
      </View>
    </TouchableNativeFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bubble_grey,
    borderRadius: 26,
    paddingTop: 15,
    paddingBottom: 5
  },
  mainContainer: {
    paddingLeft: 20,
    paddingRight: 20,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5
  },
  title: {
    color: colors.white,
    fontSize: 16,
    fontFamily: 'notoSansRegular',
    width: '40%',
  },
  expand_button: {
    width: 22,
    height: 22,
    backgroundColor: colors.button_grey,
    borderRadius: 500000,
    justifyContent: 'center',
    alignItems: 'center'
  },
  expand_icon: {
    tintColor: colors.white,
    width: 24,
    height: 24,
  },


  buttons_cotainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap:24,
    paddingTop: 2,
    paddingBottom: 5
  },
  button: {
    borderRadius: 500000,
    width: 80,
    height: 80,
    backgroundColor: colors.grey,
    justifyContent: 'center',
    alignItems: 'center'
  },
  label: {
    color: colors.grey,
    fontSize: 14,
    fontFamily: 'notoSansRegular',
    paddingTop: 6,
    paddingBottom: 2
  },
  hide_icon: {
    width: 24,
    height: 24,
    tintColor: colors.bubble_grey
  },
  open_icon: {
    width: 28,
    height: 28,
    tintColor: colors.bubble_grey
  },


  extraButtons: {
    flexDirection: 'column',
    padding: 10,
    gap: 1
  },
  extraButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontFamily: 'notoSansRegular',
    paddingBottom: 2
  },
});