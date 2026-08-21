import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppButton } from '@/components/app-button';
import { AppModeSwitcher } from '@/components/app-mode-switcher';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadProfilePhotoMutation,
} from '@/api/hooks/use-auth';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Profile'>;

export function ProfileScreen({ navigation }: Props) {
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
    if (!asset.uri || !asset.type) {
      Alert.alert('Photo error', 'Could not read selected image');
      return;
    }

    uploadPhotoMutation.mutate(
      {
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName ?? 'profile.jpg',
      },
      {
        onError: (error) => Alert.alert('Upload failed', error.message),
      },
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={profileQuery.isLoading}
        isError={profileQuery.isError}
        errorMessage={profileQuery.error?.message}
      >
        {profile ? (
          <>
            {profile.profilePhotoUrl ? (
              <Image source={{ uri: profile.profilePhotoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <AppText variant="title">{profile.fullName.charAt(0)}</AppText>
              </View>
            )}

            <AppButton
              title="Change profile photo"
              variant="secondary"
              loading={uploadPhotoMutation.isPending}
              onPress={() => {
                void handlePickPhoto();
              }}
            />

            <View style={styles.section}>
              <AppText variant="label">Switch profile</AppText>
              <AppText variant="caption" style={styles.note}>
                One account can rent and list vehicles. Switch between renter and owner mode to
                change what you see on the home screen.
              </AppText>
              <AppModeSwitcher compact />
            </View>

            <AppText variant="label">Full name</AppText>
            <AppInput
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

            <View style={styles.section}>
              <AppText variant="label">Email</AppText>
              <AppText variant="body">{profile.email}</AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="label">CNIC</AppText>
              <AppText variant="body">{profile.cnic}</AppText>
              <AppText variant="caption" style={styles.note}>
                Your CNIC is private and only visible to you and rental participants in agreements.
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="label">Account status</AppText>
              <AppText variant="body">{profile.status}</AppText>
              <AppText variant="body">
                Email verified: {profile.emailVerified ? 'Yes' : 'No'}
              </AppText>
            </View>

            <View style={styles.section}>
              <AppText variant="label">Member since</AppText>
              <AppText variant="body">{new Date(profile.createdAt).toLocaleDateString()}</AppText>
            </View>
          </>
        ) : null}
      </QueryState>

      <AppButton title="Back" variant="secondary" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignSelf: 'center',
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    gap: spacing.xs,
  },
  note: {
    color: colors.textSecondary,
  },
});
