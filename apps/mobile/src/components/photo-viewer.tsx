import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthenticatedImage } from '@/components/authenticated-image';
import { AppText } from '@/components/app-text';
import { colors, spacing } from '@/theme';

export type PhotoViewerItem = {
  id: string;
  url: string;
};

type PhotoViewerProps = {
  visible: boolean;
  photos: PhotoViewerItem[];
  initialIndex?: number;
  authenticated?: boolean;
  onClose: () => void;
  onRemovePhoto?: (photoId: string) => void;
};

export function PhotoViewer({
  visible,
  photos,
  initialIndex = 0,
  authenticated = false,
  onClose,
  onRemovePhoto,
}: PhotoViewerProps) {
  const { width, height } = useWindowDimensions();
  const listRef = useRef<FlatList<PhotoViewerItem>>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible || photos.length === 0) {
      return;
    }

    const nextIndex = Math.min(initialIndex, photos.length - 1);
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: nextIndex, animated: false });
    });
  }, [visible, initialIndex, photos.length]);

  useEffect(() => {
    if (index >= photos.length && photos.length > 0) {
      setIndex(photos.length - 1);
    }
  }, [index, photos.length]);

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const next = Math.round(event.nativeEvent.contentOffset.x / width);
      if (next >= 0 && next < photos.length) {
        setIndex(next);
      }
    },
    [photos.length, width],
  );

  const currentPhoto = photos[index];

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.backdrop}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.toolbar}>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button">
              <AppText variant="body" style={styles.toolbarText}>
                Close
              </AppText>
            </Pressable>
            <AppText variant="body" style={styles.toolbarText}>
              {photos.length === 0 ? '0 / 0' : `${index + 1} / ${photos.length}`}
            </AppText>
          </View>

          <FlatList
            ref={listRef}
            data={photos}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_, itemIndex) => ({
              length: width,
              offset: width * itemIndex,
              index: itemIndex,
            })}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => {
                listRef.current?.scrollToIndex({ index: info.index, animated: false });
              }, 50);
            }}
            renderItem={({ item }) => (
              <View style={{ width, height: height * 0.78, justifyContent: 'center' }}>
                <AuthenticatedImage
                  uri={item.url}
                  authenticated={authenticated}
                  resizeMode="contain"
                  style={styles.fullImage}
                  accessibilityLabel="Vehicle photo"
                />
              </View>
            )}
          />

          {onRemovePhoto && currentPhoto ? (
            <Pressable
              style={styles.remove}
              onPress={() => onRemovePhoto(currentPhoto.id)}
              accessibilityRole="button"
            >
              <AppText variant="body" style={styles.removeText}>
                Remove this photo
              </AppText>
            </Pressable>
          ) : null}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  safe: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  toolbarText: {
    color: colors.textOnPrimary,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  remove: {
    alignSelf: 'center',
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  removeText: {
    color: colors.errorMuted,
  },
});
