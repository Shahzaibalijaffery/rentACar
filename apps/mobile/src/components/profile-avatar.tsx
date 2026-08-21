import { useEffect, useState } from 'react';
import { Image, StyleSheet, View, type ImageStyle, type ViewStyle } from 'react-native';
import { AppText } from '@/components/app-text';
import { isDisplayableImageUrl } from '@/utils/image-url';
import { colors, radii } from '@/theme';

type ProfileAvatarProps = {
  fullName: string;
  profilePhotoUrl?: string | null;
  size?: number;
  style?: ViewStyle;
};

export function ProfileAvatar({
  fullName,
  profilePhotoUrl,
  size = 96,
  style,
}: ProfileAvatarProps) {
  const [loadFailed, setLoadFailed] = useState(false);
  const canShowPhoto = isDisplayableImageUrl(profilePhotoUrl) && !loadFailed;
  const initial = fullName.trim().charAt(0).toUpperCase() || '?';

  useEffect(() => {
    setLoadFailed(false);
  }, [profilePhotoUrl]);

  if (canShowPhoto) {
    return (
      <Image
        source={{ uri: profilePhotoUrl }}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          style as ImageStyle | undefined,
        ]}
        onError={() => setLoadFailed(true)}
        accessibilityLabel="Profile photo"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        { width: size, height: size, borderRadius: size / 2 },
        style,
      ]}
    >
      <AppText variant="title" style={styles.initial}>
        {initial}
      </AppText>
    </View>
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
});
