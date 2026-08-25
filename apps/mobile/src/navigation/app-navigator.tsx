import {
  createNativeStackNavigator,
  type NativeStackNavigationOptions,
} from '@react-navigation/native-stack';
import { DiscoveryScreen } from '@/features/discovery/screens/discovery-screen';
import { DiscoveryVehicleDetailScreen } from '@/features/discovery/screens/discovery-vehicle-detail-screen';
import { HomeScreen } from '@/features/home/screens/home-screen';
import { NotificationsScreen } from '@/features/notifications/screens/notifications-screen';
import { ProfileScreen } from '@/features/profile/screens/profile-screen';
import { AddVehicleScreen } from '@/features/vehicles/screens/add-vehicle-screen';
import { EditVehicleScreen } from '@/features/vehicles/screens/edit-vehicle-screen';
import { MyVehiclesScreen } from '@/features/vehicles/screens/my-vehicles-screen';
import { VehicleDetailsScreen } from '@/features/vehicles/screens/vehicle-details-screen';
import { RentalsScreen } from '@/features/rentals/screens/rentals-screen';
import { RentalRequestDetailScreen } from '@/features/rentals/screens/rental-request-detail-screen';
import { CreateAgreementScreen } from '@/features/agreements/screens/create-agreement-screen';
import { AgreementDetailScreen } from '@/features/agreements/screens/agreement-detail-screen';
import { PickupHandoverScreen } from '@/features/handovers/screens/pickup-handover-screen';
import { ProfileSearchScreen } from '@/features/users/screens/profile-search-screen';
import { CompactHeader } from '@/components/compact-header';
import { useTranslation } from 'react-i18next';
import type { AppStackParamList } from '@/navigation/types';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<AppStackParamList>();

const screenOptions: NativeStackNavigationOptions = {
  header: (props) => <CompactHeader {...props} />,
  headerTintColor: colors.primary,
  contentStyle: { backgroundColor: colors.background },
  statusBarStyle: 'dark',
};

export function AppNavigator() {
  const { t } = useTranslation('nav');

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: t('home') }} />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: t('notifications') }}
      />
      <Stack.Screen
        name="ProfileSearch"
        component={ProfileSearchScreen}
        options={{ title: t('profileSearch') }}
      />
      <Stack.Screen name="Discovery" component={DiscoveryScreen} options={{ title: t('discovery') }} />
      <Stack.Screen
        name="DiscoveryVehicleDetail"
        component={DiscoveryVehicleDetailScreen}
        options={{ title: t('vehicleDetails') }}
      />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: t('profile') }} />
      <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} options={{ title: t('myVehicles') }} />
      <Stack.Screen name="AddVehicle" component={AddVehicleScreen} options={{ title: t('addVehicle') }} />
      <Stack.Screen
        name="EditVehicle"
        component={EditVehicleScreen}
        options={{ title: t('editVehicle') }}
      />
      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
        options={{ title: t('vehicleDetails') }}
      />
      <Stack.Screen name="Rentals" component={RentalsScreen} options={{ title: t('rentals') }} />
      <Stack.Screen
        name="RentalRequestDetail"
        component={RentalRequestDetailScreen}
        options={{ title: t('rentalDetails') }}
      />
      <Stack.Screen
        name="CreateAgreement"
        component={CreateAgreementScreen}
        options={{ title: t('createAgreement') }}
      />
      <Stack.Screen
        name="AgreementDetail"
        component={AgreementDetailScreen}
        options={{ title: t('agreement') }}
      />
      <Stack.Screen
        name="PickupHandover"
        component={PickupHandoverScreen}
        options={{ title: t('pickupPhotos') }}
      />
    </Stack.Navigator>
  );
}
