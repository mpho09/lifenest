import { router } from 'expo-router';
import {
  ChevronRight,
  FilePen,
  FileText,
  HeartPulse,
  KeyRound,
  LogOut,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Card, Grid, Screen, Small, Title } from '../../components/ui';
import { logOut } from '../../lib/api/auth';
import { PRIVACY_URL } from '../../lib/links';
import { labels } from '../../lib/messages';
import { useProfile } from '../../lib/queries';
import { tokens } from '../../theme/tokens';

function MoreRow({
  icon: Icon,
  label,
  onPress,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const color = danger ? tokens.color.error : tokens.color.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <Icon color={color} size={22} />
      <Text style={[styles.label, danger && { color: tokens.color.error }]}>{label}</Text>
      <ChevronRight color={tokens.color.textSecondary} size={20} />
    </Pressable>
  );
}

/** S18 More (docs/designs/S18.png). Log out has no confirmation (PRD 5). */
export default function More() {
  const profile = useProfile();
  return (
    <Screen>
      <AppHeader />
      <Title>More</Title>
      {profile.data ? (
        <Small>
          {profile.data.full_name ? `${profile.data.full_name} · ${profile.data.email}` : profile.data.email}
        </Small>
      ) : null}
      <Grid columns={3}>
        <Card>
          <MoreRow icon={FilePen} label={labels.instructionsAndMessages} onPress={() => router.push('/instructions')} />
          <MoreRow
            icon={HeartPulse}
            label={labels.emergencyProfile}
            onPress={() => router.push('/emergency-profile')}
          />
        </Card>
        <Card>
          <MoreRow icon={KeyRound} label={labels.changePin} onPress={() => router.push('/profile-setup?mode=pin')} />
          {PRIVACY_URL ? (
            <MoreRow icon={FileText} label={labels.privacyNotice} onPress={() => Linking.openURL(PRIVACY_URL)} />
          ) : null}
          <MoreRow
            icon={LogOut}
            label={labels.logOut}
            onPress={async () => {
              await logOut();
              router.replace('/welcome');
            }}
          />
        </Card>
        <Card>
          <MoreRow
            icon={Trash2}
            label={labels.deleteAccount}
            danger
            onPress={() => router.push('/modals/delete-account')}
          />
        </Card>
      </Grid>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
    minHeight: tokens.size.touchMin + tokens.space[2],
  },
  label: { ...tokens.font.body, color: tokens.color.text, flex: 1 },
});
