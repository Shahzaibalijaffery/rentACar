import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { AppText } from '@/components/app-text';
import { PhotoViewer } from '@/components/photo-viewer';
import { isDisplayableImageUrl } from '@/utils/image-url';
import { colors } from '@/theme';

type ProfileAvatarProps = {
  fullName: string;
  profilePhotoUrl?: string | null;
  size?: number;
  style?: ViewStyle;
  onEdit?: () => void;
  editLoading?: boolean;
};

export function ProfileAvatar({
  fullName,
  profilePhotoUrl,
  size = 96,
  style,
  onEdit,
  editLoading = false,
}: ProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const canShowPhoto = isDisplayableImageUrl(profilePhotoUrl) && !loadFailed;
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';
  const badgeSize = Math.max(28, Math.round(size * 0.32));

  useEffect(() => {
    setLoadFailed(false);
  }, [profilePhotoUrl]);

  const avatarStyle = [
    styles.avatar,
    { width: size, height: size, borderRadius: size / 2 },
    style as ImageStyle | undefined,
  ];

  const avatar = canShowPhoto ? (
    <Pressable
      onPress={() => setViewerOpen(true)}
      accessibilityRole="imagebutton"
      accessibilityLabel="View full profile photo"
    >
      <Image
        source={{ uri: profilePhotoUrl }}
        style={avatarStyle}
        onError={() => setLoadFailed(true)}
        accessibilityLabel="Profile photo"
      />
    </Pressable>
  ) : (
    <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }, style]}>
      <AppText variant="title" style={styles.initial}>
        {initial}
      </AppText>
    </View>
  );

  return (
    <>
      <View style={{ width: size, height: size }}>
        {avatar}
        {onEdit ? (
          <Pressable
            onPress={onEdit}
            disabled={editLoading}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={[
              styles.editBadge,
              { width: badgeSize, height: badgeSize, borderRadius: badgeSize / 2 },
            ]}
          >
            {editLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <AppText variant="caption" style={styles.editIcon}>
                ✎
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>
      {canShowPhoto ? (
        <PhotoViewer
          visible={viewerOpen}
          photos={[{ id: 'profile-photo', url: profilePhotoUrl }]}
          onClose={() => setViewerOpen(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.backgroundSecondary,
  },
  placeholder: {
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: colors.primary,
  },
  editBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.surface,
  },
  editIcon: {
    color: colors.textOnPrimary,
    fontSize: 14,
    lineHeight: 16,
  },
});
