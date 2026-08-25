import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { useDiscoveryInfiniteQuery } from '@/api/hooks/use-discovery';
import { VehicleDiscoveryCard } from '@/features/discovery/components/vehicle-discovery-card';
import { useDeviceLocation } from '@/features/discovery/hooks/use-device-location';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'Discovery'>;

const RADIUS_OPTIONS = [5, 10, 25];

export function DiscoveryScreen({ navigation }: Props) {
  const { t } = useTranslation('discovery');
  const {
    location,
    permissionState,
    isLoading: isLocationLoading,
    errorMessage: locationError,
    requestLocation,
    setManualLocation,
  } = useDeviceLocation();

  const [radiusKm, setRadiusKm] = useState(10);
  const [makeFilter, setMakeFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

  useEffect(() => {
    if (!hasRequestedLocation) {
      setHasRequestedLocation(true);
      void requestLocation();
    }
  }, [hasRequestedLocation, requestLocation]);

  const searchParams = useMemo(() => {
    if (!location) {
      return null;
    }

    return {
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm,
      make: makeFilter.trim() || undefined,
      model: modelFilter.trim() || undefined,
      availability: 'AVAILABLE' as const,
    };
  }, [location, radiusKm, makeFilter, modelFilter]);

  const discoveryQuery = useDiscoveryInfiniteQuery({
    latitude: searchParams?.latitude ?? 0,
    longitude: searchParams?.longitude ?? 0,
    radiusKm: searchParams?.radiusKm,
    make: searchParams?.make,
    model: searchParams?.model,
    availability: searchParams?.availability,
    enabled: searchParams !== null,
  });

  const vehicles = discoveryQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const total = discoveryQuery.data?.pages[0]?.meta.total ?? 0;

  const handleManualSearch = () => {
    const latitude = Number(manualLatitude);
    const longitude = Number(manualLongitude);

    if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
      return;
    }

    if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
      return;
    }

    setManualLocation({ latitude, longitude });
  };

  const showLocationFallback = permissionState === 'denied' && !location;

  return (
    <View style={styles.container}>
      <AppText variant="caption" style={styles.hint}>
        {t('hint')}
      </AppText>

      {isLocationLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption">{t('gettingLocation')}</AppText>
        </View>
      ) : null}

      {locationError ? (
        <AppText variant="caption" style={styles.warning}>
          {locationError}
        </AppText>
      ) : null}

      {showLocationFallback ? (
        <View style={styles.fallback}>
          <AppText variant="body">{t('locationFallback')}</AppText>
          <AppInput
            placeholder={t('latitude')}
            keyboardType="decimal-pad"
            value={manualLatitude}
            onChangeText={setManualLatitude}
          />
          <AppInput
            placeholder={t('longitude')}
            keyboardType="decimal-pad"
            value={manualLongitude}
            onChangeText={setManualLongitude}
          />
          <AppButton title={t('searchArea')} onPress={handleManualSearch} />
          <AppButton
            title={t('tryLocation')}
            variant="secondary"
            onPress={() => void requestLocation()}
          />
        </View>
      ) : null}

      {location ? (
        <>
          <View style={styles.filters}>
            <AppText variant="label">{t('radius')}</AppText>
            <View style={styles.radiusRow}>
              {RADIUS_OPTIONS.map((option) => (
                <AppButton
                  key={option}
                  title={t('km', { count: option })}
                  variant={radiusKm === option ? 'primary' : 'secondary'}
                  onPress={() => setRadiusKm(option)}
                />
              ))}
            </View>
            <AppInput
              icon="search"
              placeholder={t('filterMake')}
              value={makeFilter}
              onChangeText={setMakeFilter}
            />
            <AppInput
              icon="car"
              placeholder={t('filterModel')}
              value={modelFilter}
              onChangeText={setModelFilter}
            />
            <AppButton
              title={t('common:refresh')}
              icon="refresh"
              variant="secondary"
              onPress={() => void discoveryQuery.refetch()}
            />
          </View>

          {discoveryQuery.isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null}

          {discoveryQuery.isError ? (
            <AppText variant="body">{discoveryQuery.error.message}</AppText>
          ) : null}

          {!discoveryQuery.isLoading && !discoveryQuery.isError ? (
            <FlatList
              style={styles.listContainer}
              data={vehicles}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl
                  refreshing={discoveryQuery.isRefetching}
                  onRefresh={() => void discoveryQuery.refetch()}
                />
              }
              ListHeaderComponent={
                <AppText variant="caption" style={styles.meta}>
                  {t('nearbyCount', { count: total, radius: radiusKm })}
                </AppText>
              }
              ListEmptyComponent={
                <EmptyState
                  icon="compass"
                  title={t('emptyNearbyTitle')}
                  message={t('emptyNearbyBody')}
                />
              }
              renderItem={({ item }) => (
                <VehicleDiscoveryCard
                  vehicle={item}
                  onPress={() =>
                    navigation.navigate('DiscoveryVehicleDetail', {
                      vehicleId: item.id,
                      distanceLabel: item.distanceLabel,
                    })
                  }
                />
              )}
              onEndReached={() => {
                if (discoveryQuery.hasNextPage && !discoveryQuery.isFetchingNextPage) {
                  void discoveryQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              ListFooterComponent={
                discoveryQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.primary} style={styles.footerLoader} />
                ) : undefined
              }
            />
          ) : null}
        </>
      ) : null}
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
  hint: {
    color: colors.textSecondary,
  },
  warning: {
    color: colors.warning,
  },
  fallback: {
    gap: spacing.sm,
  },
  filters: {
    gap: spacing.sm,
  },
  listContainer: {
    flex: 1,
  },
  radiusRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
  },
  meta: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  footerLoader: {
    marginVertical: spacing.md,
  },
});
