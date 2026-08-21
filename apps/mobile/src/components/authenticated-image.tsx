import { Image, type ImageProps, type ImageStyle, type StyleProp } from 'react-native';
import { useAuthStore } from '@/stores/auth-store';

type AuthenticatedImageProps = Omit<ImageProps, 'source'> & {
  uri: string;
  authenticated?: boolean;
  style?: StyleProp<ImageStyle>;
};

export function AuthenticatedImage({
  uri,
  authenticated = false,
  style,
  ...props
}: AuthenticatedImageProps) {
  const accessToken = useAuthStore((state) => state.accessToken);

  return (
    <Image
      {...props}
      style={style}
      source={{
        uri,
        headers:
          authenticated && accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      }}
    />
  );
}
