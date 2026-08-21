import { Linking, StyleSheet, View } from 'react-native';
import type { RentalRequestProfile } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { formatRentalDate } from '@/features/rentals/rental-utils';
import { colors, spacing } from '@/theme';

type Props = {
  label: string;
  profile: RentalRequestProfile;
  phone?: string | null;
};

export function RentalRequestProfileCard({ label, profile, phone }: Props) {
  return (
    <View style={styles.card}>
      <AppText variant="label">{label}</AppText>
      <View style={styles.row}>
        <ProfileAvatar
          fullName={profile.fullName}
          profilePhotoUrl={profile.profilePhotoUrl}
          size={56}
        />
        <View style={styles.meta}>
          <AppText variant="title">{profile.fullName}</AppText>
          <AppText variant="caption">Member since {formatRentalDate(profile.memberSince)}</AppText>
        </View>
      </View>
      {phone ? (
        <>
          <AppText variant="body">Phone: {phone}</AppText>
          <AppButton
            title="Call"
            variant="secondary"
            onPress={() => {
              void Linking.openURL(`tel:${phone}`);
            }}
          />
        </>
      ) : (
        <AppText variant="caption">Phone number is shared after the owner accepts.</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  meta: {
    flex: 1,
    gap: spacing.xs,
  },
});
