import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { AgreementParticipant } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { useLookupUserByCnicMutation } from '@/api/hooks/use-users';
import { colors, radii, spacing } from '@/theme';

type Props = {
  participantLabel: string;
};

export function CnicProfileLookup({ participantLabel }: Props) {
  const [cnic, setCnic] = useState('');
  const [profile, setProfile] = useState<AgreementParticipant | null>(null);
  const lookupMutation = useLookupUserByCnicMutation();

  const handleLookup = () => {
    const trimmedCnic = cnic.trim();
    if (!trimmedCnic) {
      Alert.alert(
        'CNIC required',
        `Enter the ${participantLabel.toLowerCase()}'s CNIC to verify their profile.`,
      );
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
          Alert.alert('Profile not found', error.message);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">Verify {participantLabel} by CNIC</AppText>
      <AppText variant="body">
        Enter the other party&apos;s CNIC to confirm their identity before pickup or handover.
      </AppText>
      <AppInput
        placeholder="35201-1234567-1"
        value={cnic}
        onChangeText={setCnic}
        keyboardType="number-pad"
      />
      <AppButton
        title="Look up profile"
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
          <AppText variant="body">CNIC: {profile.cnic}</AppText>
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
