import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RentalLifecycleFilter } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppText } from '@/components/app-text';
import { QueryState } from '@/components/query-state';
import { useIncomingRentalsQuery } from '@/api/hooks/use-rentals';
import { RentalLifecycleTabs } from '@/features/rentals/components/rental-lifecycle-tabs';
import { RentalListItem } from '@/features/rentals/components/rental-list-item';
import type { AppStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';

type Props = NativeStackScreenProps<AppStackParamList, 'OwnerRentalRequests'>;

function emptyMessage(lifecycle: RentalLifecycleFilter): string {
  switch (lifecycle) {
    case 'active':
      return 'No active rentals for your vehicles.';
    case 'completed':
      return 'No completed rentals yet.';
    default:
      return 'No rental requests for your vehicles yet.';
  }
}

export function OwnerRentalRequestsScreen({ navigation, route }: Props) {
  const initialLifecycle = route.params?.lifecycle ?? 'all';
  const [lifecycle, setLifecycle] = useState<RentalLifecycleFilter>(initialLifecycle);
  const rentalsQuery = useIncomingRentalsQuery(lifecycle);

  return (
    <View style={styles.container}>
      <RentalLifecycleTabs value={lifecycle} onChange={setLifecycle} />

      <QueryState
        isLoading={rentalsQuery.isLoading}
        isError={rentalsQuery.isError}
        errorMessage={rentalsQuery.error?.message}
      >
        {rentalsQuery.data && rentalsQuery.data.length === 0 ? (
          <AppText variant="body">{emptyMessage(lifecycle)}</AppText>
        ) : (
          <FlatList
            data={rentalsQuery.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <RentalListItem
                rental={item}
                perspective="owner"
                onPress={() =>
                  navigation.navigate('RentalRequestDetail', {
                    rentalId: item.id,
                    perspective: 'owner',
                  })
                }
              />
            )}
          />
        )}
      </QueryState>

      <AppButton title="Back" variant="secondary" onPress={() => navigation.goBack()} />
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
  list: {
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
});
