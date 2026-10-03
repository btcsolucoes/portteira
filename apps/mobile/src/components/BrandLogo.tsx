import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/** Displays the original supplied artwork; only its empty margins are clipped by the layout. */
export function BrandLogo() {
  return (
    <View style={styles.frame} accessibilityRole="header" accessibilityLabel="Portteira" accessible>
      <Image
        source={require('../../assets/portteira-logo-original.png')}
        accessible={false}
        contentFit="cover"
        contentPosition="center"
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    flex: 1,
    maxWidth: 220,
    height: 52,
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: '#FDFBF7',
  },
});
