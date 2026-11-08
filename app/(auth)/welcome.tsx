import { router } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { FlatVault } from '../../components/three/FlatVault';
import { Scene3DGate } from '../../components/three/Scene3DGate';
import { VaultDoorScene } from '../../components/three/VaultDoorScene';
import { labels } from '../../lib/messages';
import { tokens } from '../../theme/tokens';

/**
 * S1 Welcome (docs/designs/S1.png). PRD text only (Section 18 #17):
 * wordmark, the PRD 1.2 pitch, "Get started" and "Log in".
 */
export default function Welcome() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.logo}>
        <Logo />
      </View>

      <View style={styles.scene}>
        <Scene3DGate
          renderScene={({ onFps }) => <VaultDoorScene onFps={onFps} />}
          fallback={<FlatVault />}
        />
      </View>

      <View style={styles.bottom}>
        <Text style={styles.pitch}>{labels.pitch}</Text>

        <Button
          title={labels.getStarted}
          onPress={() => router.push('/sign-up')}
          trailingIcon={<ArrowRight color={tokens.color.surface} size={20} />}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.logIn}
          onPress={() => router.push('/log-in')}
          style={styles.logIn}
        >
          <Text style={styles.logInText}>{labels.logIn}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: tokens.color.background,
    paddingHorizontal: tokens.space.screen,
  },
  logo: { alignItems: 'center', paddingTop: tokens.space[6] },
  scene: { flex: 1, marginVertical: tokens.space[6] },
  bottom: { gap: tokens.space[6], paddingBottom: tokens.space[6] },
  pitch: { ...tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
  logIn: {
    minHeight: tokens.size.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logInText: {
    ...tokens.font.button,
    color: tokens.color.primary,
    textDecorationLine: 'underline',
  },
});
