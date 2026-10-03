import { IconButton } from './IconButton';
import { useTheme } from './ThemeProvider';
export function ThemeToggle() {
  const { scheme, setPreference } = useTheme();
  return (
    <IconButton
      name={scheme === 'light' ? 'moon' : 'sun'}
      label={scheme === 'light' ? 'Usar tema escuro' : 'Usar tema claro'}
      onPress={() => setPreference(scheme === 'light' ? 'dark' : 'light')}
    />
  );
}
