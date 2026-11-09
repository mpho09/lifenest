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
import { useIsWide } from '../../lib/useLayout';
import { tokens } from '../../theme/tokens';

/**
 * S1 Welcome (docs/designs/S1.png). PRD text only (Section 18 #17):
 * wordmark, the PRD 1.2 pitch, "Get started" and "Log in".
 * Wide screens get a two-column page: text and buttons left, vault door right (Section 18 #34).
 */
export default function Welcome() {
  const wide = useIsWide();

  const scene = (
    <Scene3DGate renderScene={({ onFps }) => <VaultDoorScene onFps={onFps} />} fallback={<FlatVault />} />
  );

  const actions = (
    <View style={[styles.actions, wide && styles.actionsWide]}>
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
  );

  if (wide) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.topBar}>
          <Logo />
        </View>
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.heroPitch}>{labels.pitch}</Text>
            {actions}
          </View>
          <View style={styles.heroScene}>{scene}</View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, styles.mobile]}>
      <View style={styles.logo}>
        <Logo />
      </View>
      <View style={styles.scene}>{scene}</View>
      <View style={styles.bottom}>
        <Text style={styles.pitch}>{labels.pitch}</Text>
        {actions}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: tokens.color.background },
  mobile: { paddingHorizontal: tokens.space.screen },
  logo: { alignItems: 'center', paddingTop: tokens.space[6] },
  scene: { flex: 1, marginVertical: tokens.space[6] },
  bottom: { gap: tokens.space[6], paddingBottom: tokens.space[6] },
  pitch: { ...tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
  actions: { gap: tokens.space[4] },
  actionsWide: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[6] },
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
  topBar: {
    paddingHorizontal: tokens.space[6] * 2,
    paddingVertical: tokens.space[6],
    borderBottomWidth: 1,
    borderBottomColor: tokens.color.divider,
    backgroundColor: tokens.color.surface,
  },
  hero: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[6] * 2,
    width: '100%',
    maxWidth: tokens.layout.content,
    alignSelf: 'center',
    paddingHorizontal: tokens.space[6] * 2,
  },
  heroText: { flex: 1, gap: tokens.space[6] },
  heroPitch: { ...tokens.font.title, color: tokens.color.text },
  heroScene: { flex: 1, aspectRatio: 1, maxHeight: tokens.layout.narrow * 0.8 },
});
