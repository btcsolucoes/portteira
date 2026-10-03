import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, IconButton, useThemedStyles, type Theme } from '@/ui';
import { useReducedMotionSetting } from '@/ui/useReducedMotionSetting';
export function OptionSheet({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { styles } = useThemedStyles(createStyles);
  const reduced = useReducedMotionSetting();
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduced ? 'none' : 'fade'}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable accessible={false} style={StyleSheet.absoluteFill} onPress={onClose} />
        <SafeAreaView
          edges={['bottom', 'left', 'right']}
          style={styles.sheet}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <AppText variant="heading" accessibilityRole="header" style={{ flex: 1 }}>
              {title}
            </AppText>
            <IconButton
              name="x"
              visibleLabel="Fechar"
              labelPosition="right"
              label={'Fechar ' + title.toLowerCase()}
              onPress={onClose}
            />
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      backgroundColor: theme.colors.scrim,
    },
    sheet: {
      width: '100%',
      maxWidth: 640,
      maxHeight: '88%',
      backgroundColor: theme.colors.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingLeft: 20,
      paddingRight: 8,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    content: { padding: 16, gap: 16 },
  });
