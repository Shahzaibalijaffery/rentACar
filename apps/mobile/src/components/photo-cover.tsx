import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { AppText } from '@/components/app-text';
import { PhotoViewer, type PhotoViewerItem } from '@/components/photo-viewer';
import { colors, radii, spacing } from '@/theme';

type PhotoCoverProps = {
  photos: PhotoViewerItem[];
  authenticated?: boolean;
  emptyLabel?: string;
  onRemovePhoto?: (photoId: string) => void;
};

export function PhotoCover({
  photos,
  authenticated = false,
  emptyLabel = 'No photos yet',
  onRemovePhoto,
}: PhotoCoverProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const cover = photos[0];

  if (!cover) {
    return (
      <View style={styles.placeholder}>
        <AppText variant="caption" style={styles.placeholderText}>
          {emptyLabel}
        </AppText>
      </View>
    );
  }

  const countLabel = photos.length === 1 ? '1 photo' : `${photos.length} photos`;

  return (
    <>
      <Pressable
        onPress={() => setViewerOpen(true)}
        accessibilityRole="imagebutton"
        accessibilityLabel={`View ${countLabel}`}
        style={({ pressed }) => [styles.cover, pressed ? styles.pressed : null]}
      >
        <AuthenticatedImage
          uri={cover.url}
          authenticated={authenticated}
          resizeMode="cover"
          style={styles.image}
        />
        <View style={styles.badge}>
          <AppText variant="caption" style={styles.badgeText}>
            {countLabel}
          </AppText>
        </View>
      </Pressable>
      <PhotoViewer
        visible={viewerOpen}
        photos={photos}
        authenticated={authenticated}
        onClose={() => setViewerOpen(false)}
        onRemovePhoto={onRemovePhoto}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cover: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  pressed: {
    opacity: 0.94,
  },
  image: {
    width: '100%',
    height: 220,
  },
  badge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.textOnPrimary,
  },
  placeholder: {
    height: 180,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
});
