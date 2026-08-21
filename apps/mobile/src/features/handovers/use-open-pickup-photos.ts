import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  useCreatePickupHandoverMutation,
  usePickupHandoverByRentalQuery,
} from '@/api/hooks/use-handovers';
import type { AppStackParamList } from '@/navigation/types';

type Navigation = NativeStackNavigationProp<AppStackParamList>;

export function useOpenPickupPhotos(rentalId: string, enabled: boolean) {
  const handoverQuery = usePickupHandoverByRentalQuery(rentalId, enabled);
  const createHandoverMutation = useCreatePickupHandoverMutation(rentalId);

  const openPickupPhotos = (
    navigation: Navigation,
    perspective: 'owner' | 'renter',
  ) => {
    const navigate = (handoverId: string) => {
      navigation.navigate('PickupHandover', {
        handoverId,
        rentalId,
        perspective,
      });
    };

    if (handoverQuery.data) {
      navigate(handoverQuery.data.id);
      return;
    }

    if (perspective !== 'owner') {
      Alert.alert(
        'Pickup photos not ready',
        'The owner has not started pickup photos yet. Check back shortly.',
      );
      return;
    }

    createHandoverMutation.mutate(undefined, {
      onSuccess: (handover) => navigate(handover.id),
      onError: (error) => Alert.alert('Could not open pickup photos', error.message),
    });
  };

  return {
    handover: handoverQuery.data,
    openPickupPhotos,
    isOpening: createHandoverMutation.isPending,
  };
}
