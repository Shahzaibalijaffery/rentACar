import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppText } from '@/components/app-text';
import { FormField } from '@/components/form-field';
import { ProfileAvatar } from '@/components/profile-avatar';
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
              />
              <AppText variant="heading">{profile.fullName}</AppText>
              <AppText variant="caption" style={styles.email}>
                {profile.email}
              </AppText>
              <AppButton
                title="Change photo"
                variant="secondary"
                size="sm"
                loading={uploadPhotoMutation.isPending}
                onPress={() => {
                  void handlePickPhoto();
                }}
              />
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
                placeholder="Full name"
                value={displayName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
              <AppButton
                title="Save name"
                loading={updateProfileMutation.isPending}
                onPress={handleSaveName}
              />
            </AppCard>

            <AppCard muted>
              <View style={styles.row}>
                <AppText variant="label">CNIC</AppText>
                <AppText variant="body">{profile.cnic}</AppText>
              </View>
              <AppText variant="caption" style={styles.note}>
                Private — only shared with rental participants in agreements.
              </AppText>
              <View style={styles.row}>
                <AppText variant="label">Phone</AppText>
                <AppText variant="body">{profile.phone}</AppText>
              </View>
              <AppText variant="caption" style={styles.note}>
                Shared with the other party only after you accept or are accepted for a rental.
              </AppText>
            </AppCard>

            <AppCard muted>
              <View style={styles.row}>
                <AppText variant="label">Status</AppText>
                <AppText variant="body">{profile.status}</AppText>
              </View>
              <View style={styles.row}>
                <AppText variant="label">Email verified</AppText>
                <AppText variant="body">{profile.emailVerified ? 'Yes' : 'No'}</AppText>
              </View>
              <View style={styles.row}>
                <AppText variant="label">Member since</AppText>
                <AppText variant="body">{new Date(profile.createdAt).toLocaleDateString()}</AppText>
              </View>
            </AppCard>
          </>
        ) : null}
      </QueryState>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: 'center',
  },
  email: {
    color: colors.textSecondary,
  },
  row: {
    gap: spacing.xs,
  },
  note: {
    color: colors.textSecondary,
  },
});
