import { Image } from 'expo-image';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { ImageKey } from '@equestre/domain';
import { AppText, useThemedStyles, type Theme } from '@/ui';
const illustration = require('../../assets/portteira-mare-demo.png');
export function MediaPhoto({
  style,
  compact = false,
  imageKey = 'pasture',
  label = 'Fotografia ilustrativa; não representa um animal ou evento real',
  aspectRatio = 4 / 3,
}: {
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  imageKey?: ImageKey;
  label?: string;
  aspectRatio?: number;
}) {
  const { theme, styles } = useThemedStyles(createStyles);
  return (
    <View style={[styles.frame, { aspectRatio }, compact && styles.compact, style]}>
      {imageKey === 'portrait' ? (
        <Image
          source={illustration}
          accessibilityLabel={label}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition={compact ? { left: '25%', top: '50%' } : 'center'}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
          <AppText color={theme.colors.muted}>Sem foto</AppText>
        </View>
      )}
      {!compact && imageKey === 'portrait' && (
        <View style={styles.caption}>
          <AppText variant="metadata" color={theme.colors.onMedia}>
            Imagem ilustrativa
          </AppText>
        </View>
      )}
    </View>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    frame: { backgroundColor: theme.colors.subtle, overflow: 'hidden' },
    compact: { width: 120, height: 132, aspectRatio: undefined, borderRadius: theme.radius.sm },
    caption: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      backgroundColor: theme.colors.mediaOverlay,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
  });
