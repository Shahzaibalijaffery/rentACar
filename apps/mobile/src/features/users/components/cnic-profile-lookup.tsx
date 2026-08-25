import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { AgreementParticipant } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useLookupUserByCnicMutation } from '@/api/hooks/use-users';
import { colors, radii, spacing } from '@/theme';

type Props = {
  participant: 'renter' | 'owner';
};

export function CnicProfileLookup({ participant }: Props) {
  const { t } = useTranslation('users');
  const [cnic, setCnic] = useState('');
  const [profile, setProfile] = useState<AgreementParticipant | null>(null);
  const lookupMutation = useLookupUserByCnicMutation();
  const role = t(`common:${participant}`);

  const handleLookup = () => {
    const trimmedCnic = cnic.trim();
    if (!trimmedCnic) {
      Alert.alert(t('cnicRequired'), t('cnicRequiredLookup', { role }));
      return;
    }

    lookupMutation.mutate(
      { cnic: trimmedCnic },
      {
        onSuccess: (data) => {
          setProfile(data);
        },
        onError: (error) => {
          setProfile(null);
          Alert.alert(t('notFound'), error.message);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">{t('verifyByCnic', { role })}</AppText>
      <AppText variant="body">{t('verifyHint')}</AppText>
      <AppInput
        placeholder="35201-1234567-1"
        value={cnic}
        onChangeText={setCnic}
        keyboardType="number-pad"
      />
      <AppButton
        title={t('lookupCta')}
        loading={lookupMutation.isPending}
        onPress={handleLookup}
      />

      {profile ? (
        <View style={styles.profileCard}>
          <ProfileAvatar
            fullName={profile.fullName}
            profilePhotoUrl={profile.profilePhotoUrl}
            size={72}
          />
          <AppText variant="title">{profile.fullName}</AppText>
          <AppText variant="body">{t('cnicLabel', { cnic: profile.cnic })}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSecondary,
  },
  profileCard: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
});
