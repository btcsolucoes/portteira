import { Feather } from '@expo/vector-icons';
import { useId, useRef, useState } from 'react';
import {
  Platform,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { IconButton } from './IconButton';
import { AppText } from './Text';
import type { Theme } from './theme';
import { useThemedStyles } from './ThemeProvider';

export type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
};

export function SearchField({
  value,
  onChangeText,
  label,
  placeholder = 'Buscar',
  hideLabel = false,
  style,
}: SearchFieldProps) {
  const { theme, styles } = useThemedStyles(createStyles);
  const labelId = useId();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  function clearSearch() {
    onChangeText('');
    // The clear button unmounts when empty; retain a meaningful keyboard focus.
    inputRef.current?.focus();
  }
  return (
    <View style={[styles.container, style]}>
      {!hideLabel && (
        <AppText variant="label" nativeID={labelId}>
          {label}
        </AppText>
      )}
      <View style={[styles.field, focused && styles.focused]}>
        <Feather
          accessible={false}
          importantForAccessibility="no"
          name="search"
          size={theme.sizes.iconSmall}
          color={theme.colors.muted}
        />
        <TextInput
          ref={inputRef}
          accessibilityRole={Platform.OS === 'web' ? undefined : 'search'}
          accessibilityLabel={label}
          accessibilityLabelledBy={hideLabel ? undefined : labelId}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.muted}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          allowFontScaling
          selectionColor={theme.colors.primary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        {value.length > 0 ? (
          <IconButton name="x" label="Limpar busca" onPress={clearSearch} />
        ) : null}
      </View>
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.space.sm },
    field: {
      minHeight: theme.sizes.touch,
      flexDirection: 'row',
      alignItems: 'center',
      paddingStart: theme.space.md,
      paddingEnd: theme.space.xs,
      gap: theme.space.sm,
      borderRadius: theme.components.field.radius,
      borderWidth: 1,
      borderColor: theme.components.field.border,
      backgroundColor: theme.components.field.background,
    },
    focused: { borderColor: theme.components.field.focus },
    input: {
      ...theme.typography.body,
      color: theme.colors.text,
      flex: 1,
      minWidth: 0,
      minHeight: theme.sizes.touch,
      paddingVertical: theme.space.sm,
    },
  });
