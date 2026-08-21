import { PhotoCover } from '@/components/photo-cover';

type HandoverPhotoGridProps = {
  photos: { id: string; url: string }[];
  onRemovePhoto?: (photoId: string) => void;
};

export function HandoverPhotoGrid({ photos, onRemovePhoto }: HandoverPhotoGridProps) {
  return (
    <PhotoCover
      photos={photos}
      authenticated
      emptyLabel="No pickup photos yet"
      onRemovePhoto={onRemovePhoto}
    />
  );
}
