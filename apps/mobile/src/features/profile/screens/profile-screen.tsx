import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits, getUserPlanLabel, resolveUserPlan } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppIcon, type AppIconName } from '@/components/app-icon';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ProfileAvatar } from '@/components/profile-avatar';
import { PlanBadge } from '@/components/plan-badge';
import { QueryState } from '@/components/query-state';
import { ScreenLayout } from '@/components/screen-layout';
import { normalizeUploadMimeType } from '@/utils/image-url';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
} from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen(_props: Props) {
  const profileQuery = useProfileQuery();
  const updateProfileMutation = useUpdateProfileMutation();
  const uploadPhotoMutation = useUploadProfilePhotoMutation();
  const [fullName, setFullName] = useState('');
  const profile = profileQuery.data;
  const displayName = fullName !== '' ? fullName : (profile?.fullName ?? '');

  useEffect(() => {
    if (profile?.fullName) {
      setFullName(profile.fullName);
    }
  }, [profile?.fullName]);

  const handleSaveName = () => {
    if (!displayName.trim()) {
      Alert.alert('Validation', 'Name cannot be empty');
      return;
    }

    updateProfileMutation.mutate(
      { fullName: displayName.trim() },
      {
        onSuccess: () => Alert.alert('Saved', 'Profile updated successfully'),
        onError: (error) => Alert.alert('Update failed', error.message),
      },
    );
  };

  const handlePickPhoto = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    const fileName = asset.fileName ?? 'profile.jpg';
    if (!asset.uri) {
      Alert.alert('Photo error', 'Could not read selected image');
      return;
    }

    uploadPhotoMutation.mutate(
      {
        uri: asset.uri,
        type: normalizeUploadMimeType(asset.type, fileName),
        name: fileName,
      },
      {
        onError: (error) => Alert.alert('Upload failed', error.message),
      },
    );
  };

  return (
    <ScreenLayout>
      <QueryState
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        errorMessage={profileQuery.error?.message}
      >
        {profile ? (
          <>
            <AppCard style={styles.profileHeader}>
              <ProfileAvatar
                fullName={profile.fullName}
                profilePhotoUrl={profile.profilePhotoUrl}
                onEdit={() => {
                  void handlePickPhoto();
                }}
                editLoading={uploadPhotoMutation.isPending}
              />
              <AppText variant="heading">{profile.fullName}</AppText>
              <PlanBadge plan={resolveUserPlan(profile.plan)} />
              <AppText variant="caption" style={styles.email}>
                {profile.email}
              </AppText>
            </AppCard>

            <AppCard>
              <AppText variant="label">Active profile</AppText>
              <AppText variant="caption" style={styles.note}>
                Switch between renter and owner mode for the home screen.
              </AppText>
              <AppModeSwitcher compact />
            </AppCard>

            <AppCard>
              <FormField
                label="Full name"
                icon="user"
                placeholder="Full name"
                value={displayName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <AppButton
                title="Save name"
                icon="check"
                loading={updateProfileMutation.isPending}
                onPress={handleSaveName}
              />
            </AppCard>

            <AppCard muted>
              <ProfileInfoRow icon="id" label="CNIC" value={profile.cnic} />
              <AppText variant="caption" style={styles.note}>
                Private — only shared with rental participants in agreements.
              </AppText>
              <ProfileInfoRow icon="phone" label="Phone" value={profile.phone} />
              <AppText variant="caption" style={styles.note}>
                Shared with the other party only after you accept or are accepted for a rental.
              </AppText>
            </AppCard>

            <AppCard muted>
              <ProfileInfoRow icon="badge" label="Plan" value={getUserPlanLabel(profile.plan)} />
              <ProfileInfoRow
                icon="car"
                label="Listed vehicles"
                value={`Up to ${getPlanLimits(profile.plan).maxListedVehicles}`}
              />
              <ProfileInfoRow
                icon="camera"
                label="Photos per listing"
                value={`Up to ${getPlanLimits(profile.plan).maxVehiclePhotos}`}
              />
              <ProfileInfoRow
                icon="photo"
                label="Rental evidence photos"
                value={`Up to ${getPlanLimits(profile.plan).maxHandoverPhotos}`}
              />
              <ProfileInfoRow icon="shield" label="Status" value={profile.status} />
              <ProfileInfoRow
                icon="mail"
                label="Email verified"
                value={profile.emailVerified ? 'Yes' : 'No'}
              />
              <ProfileInfoRow
                icon="calendar"
                label="Member since"
                value={new Date(profile.createdAt).toLocaleDateString()}
              />
            </AppCard>
          </>
        ) : null}
      </QueryState>
    </ScreenLayout>
  );
}

function ProfileInfoRow({
  icon,
  label,
  value,
}: {
  icon: AppIconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <AppIcon name={icon} size={16} color={colors.primary} />
      </View>
      <View style={styles.infoCopy}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="body">{value}</AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
  },
  email: {
    color: colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  infoCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  note: {
    color: colors.textSecondary,
  },
});
