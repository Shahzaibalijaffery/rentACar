import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { DEFAULT_RENTAL_AGREEMENT_TERMS } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import { useCreateRentalMutation } from '@/api/hooks/use-rentals';
import { usePublicVehicleQuery } from '@/api/hooks/use-discovery';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'DiscoveryVehicleDetail'>;

export function DiscoveryVehicleDetailScreen({ navigation, route }: Props) {
  const { vehicleId, distanceLabel } = route.params;
  const vehicleQuery = usePublicVehicleQuery(vehicleId);
  const createRentalMutation = useCreateRentalMutation();

  const vehicle = vehicleQuery.data;
  const canRequestRental = vehicle?.availability === 'AVAILABLE';

  const handleRequestRental = () => {
    if (!vehicle) {
      return;
    }

    Alert.alert(
      'Request rental',
      `Send a request for ${vehicle.year} ${vehicle.make} ${vehicle.model}? If the owner accepts, the rental terms apply and pickup photos start next.\n\n${DEFAULT_RENTAL_AGREEMENT_TERMS}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send request',
          onPress: () => {
            createRentalMutation.mutate(
              { vehicleId: vehicle.id },
              {
                onSuccess: (rental) => {
                  Alert.alert(
                    'Request sent',
                    'Waiting for the owner to accept. Pickup starts as soon as they do.',
                    [
                      {
                        text: 'View request',
                        onPress: () =>
                          navigation.navigate('RentalRequestDetail', {
                            rentalId: rental.id,
                            perspective: 'renter',
                          }),
                      },
                      { text: 'OK' },
                    ],
                  );
                },
                onError: (error) => Alert.alert('Request failed', error.message),
              },
            );
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <QueryState
        isLoading={vehicleQuery.isLoading}
        isError={vehicleQuery.isError}
        errorMessage={vehicleQuery.error?.message}
      >
        {vehicle ? (
          <>
            <AppText variant="title">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </AppText>
            <AppText variant="body">Color: {vehicle.color}</AppText>
            <AppText variant="body">Availability: {vehicle.availability}</AppText>
            {distanceLabel ? <AppText variant="body">{distanceLabel}</AppText> : null}
            {vehicle.areaLabel ? <AppText variant="body">Area: {vehicle.areaLabel}</AppText> : null}
            <AppText variant="body">Owner: {vehicle.owner.fullName}</AppText>

            <AppText variant="label">Photos</AppText>
            <View style={styles.photoGrid}>
              {vehicle.photos.map((photo) => (
                <Image key={photo.id} source={{ uri: photo.url }} style={styles.photo} />
              ))}
            </View>

            {canRequestRental ? (
              <AppButton
                title="Request rental"
                loading={createRentalMutation.isPending}
                onPress={handleRequestRental}
              />
            ) : (
              <AppText variant="body">This vehicle is not available for rental requests.</AppText>
            )}
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
  photoGrid: {
    gap: spacing.sm,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: colors.backgroundSecondary,
  },
});
