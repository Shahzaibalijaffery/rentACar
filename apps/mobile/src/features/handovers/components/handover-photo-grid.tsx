import { Image, ImageProps, StyleSheet, View } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';
import { colors, radii, spacing } from '@/theme';

type AuthenticatedImageProps = Omit<ImageProps, 'source'> & {
  uri: string;
};

export function AuthenticatedImage({ uri, style, ...props }: AuthenticatedImageProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <Image
      {...props}
      style={[styles.image, style]}
      source={{
        uri,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }}
    />
  );
}

type HandoverPhotoGridProps = {
  photos: { id: string; url: string }[];
};

export function HandoverPhotoGrid({ photos }: HandoverPhotoGridProps) {
  if (photos.length === 0) {
    return null;
  }

  return (
    <View style={styles.grid}>
      {photos.map((photo) => (
        <AuthenticatedImage key={photo.id} uri={photo.url} accessibilityLabel="Handover photo" />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.sm,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    backgroundColor: colors.backgroundSecondary,
  },
});
