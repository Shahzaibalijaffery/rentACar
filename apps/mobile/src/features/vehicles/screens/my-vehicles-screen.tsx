import { Alert, FlatList, Image, Pressable, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getPlanLimits } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppIcon } from '@/components/app-icon';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { QueryState } from '@/components/query-state';
import { useProfileQuery } from '@/api/hooks/use-auth';
import { useMyVehiclesQuery } from '@/api/hooks/use-vehicles';
import { RatingSummaryText } from '@/features/ratings/components/rating-summary-text';
import type { AppStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'MyVehicles'>;

export function MyVehiclesScreen({ navigation }: Props) {
  const { t } = useTranslation('vehicles');
  const vehiclesQuery = useMyVehiclesQuery();
  const profileQuery = useProfileQuery();
  const limits = getPlanLimits(profileQuery.data?.plan);
  const listedCount = vehiclesQuery.data?.length ?? 0;
  const atListingLimit = listedCount >= limits.maxListedVehicles;

  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.limitHint}>
        {t('planLimit', { count: listedCount, limit: limits.maxListedVehicles })}
      </AppText>
      <AppButton
        title={t('addVehicle')}
        icon="plus"
        onPress={() => {
          if (atListingLimit) {
            Alert.alert(t('planLimitTitle'), t('planLimitBody', { limit: limits.maxListedVehicles }));
            return;
          }
          navigation.navigate('AddVehicle');
        }}
      />

      <QueryState
        isLoading={vehiclesQuery.isLoading}
        isError={vehiclesQuery.isError}
        errorMessage={vehiclesQuery.error?.message}
      >
        <FlatList
          data={vehiclesQuery.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="car"
              title={t('noVehicles')}
              message={t('noVehiclesBody')}
            />
          }
          renderItem={({ item }) => {
            const coverPhoto = item.photos[0];

            return (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('VehicleDetails', { vehicleId: item.id })}
              >
                {coverPhoto ? (
                  <View>
                    <Image source={{ uri: coverPhoto.url }} style={styles.photo} />
                    <View style={styles.badge}>
                      <AppIcon name="camera" size={12} color={colors.textOnPrimary} />
                      <AppText variant="caption" style={styles.badgeText}>
                        {t('photoCount', { count: item.photos.length })}
                      </AppText>
                    </View>
                  </View>
                ) : (
                  <View style={styles.photoPlaceholder}>
                    <AppIcon name="camera" size={26} color={colors.textSecondary} />
                    <AppText variant="caption" style={styles.placeholderText}>
                      {t('noPhoto')}
                    </AppText>
                  </View>
                )}
                <View style={styles.content}>
                  <AppText variant="body" style={styles.title}>
                    {item.year} {item.make} {item.model}
                  </AppText>
                  <AppText variant="caption" style={styles.meta}>
                    {t('colorMeta', {
                      color: item.color,
                      availability:
                        item.availability === 'AVAILABLE'
                          ? t('common:available')
                          : t('common:unavailable'),
                    })}
                  </AppText>
                  <RatingSummaryText summary={item.rating} />
                  {item.areaLabel ? (
                    <View style={styles.areaRow}>
                      <AppIcon name="pin" size={13} color={colors.textSecondary} />
                      <AppText variant="caption" style={styles.meta}>
                        {item.areaLabel}
                      </AppText>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      </QueryState>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    gap: spacing.md,
  },
  limitHint: {
    color: colors.textSecondary,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  photo: {
    width: '100%',
    height: 160,
    backgroundColor: colors.surfaceMuted,
  },
  photoPlaceholder: {
    width: '100%',
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  badge: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(28, 22, 18, 0.72)',
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.textOnPrimary,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontWeight: '600',
  },
  meta: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  areaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
