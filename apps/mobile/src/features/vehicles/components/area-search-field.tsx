import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import type { AreaSearchResult } from '@rentacar/shared';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { reverseGeocodeArea, useAreaSearchQuery } from '@/api/hooks/use-geocoding';
import {
  readCurrentDeviceLocation,
  requestAndroidLocationPermission,
} from '@/services/location-service';
import { colors, radii, spacing } from '@/theme';

const MIN_SEARCH_LENGTH = 2;

type AreaSearchFieldProps = {
  selectedAreaLabel: string;
  latitude: string;
  longitude: string;
  onSelect: (result: AreaSearchResult) => void;
  onClearSelection: () => void;
};

export function AreaSearchField({
  selectedAreaLabel,
  latitude,
  longitude,
  onSelect,
  onClearSelection,
}: AreaSearchFieldProps) {
  const [query, setQuery] = useState(selectedAreaLabel);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const trimmedQuery = query.trim();
  const areaSearchQuery = useAreaSearchQuery(showResults ? query : '');
  const hasSelection = Boolean(selectedAreaLabel && latitude && longitude);
  const results = areaSearchQuery.data ?? [];

  useEffect(() => {
    if (selectedAreaLabel && !query) {
      setQuery(selectedAreaLabel);
    }
  }, [selectedAreaLabel, query]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    setShowResults(true);

    if (hasSelection && text.trim() !== selectedAreaLabel.trim()) {
      onClearSelection();
    }
  };

  const handleSelect = (result: AreaSearchResult) => {
    setQuery(result.areaLabel);
    setShowResults(false);
    onSelect(result);
  };

  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    try {
      const granted = await requestAndroidLocationPermission();
      if (!granted) {
        Alert.alert('Location needed', 'Allow location access to set the vehicle area.');
        return;
      }

      const location = await readCurrentDeviceLocation();
      const resolved = await reverseGeocodeArea(location.latitude, location.longitude);
      setQuery(resolved.areaLabel);
      setShowResults(false);
      onSelect(resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not read location';
      Alert.alert('Location error', message);
    } finally {
      setGpsLoading(false);
    }
  };

  const renderResultsPanel = () => {
    if (!showResults || trimmedQuery.length === 0) {
      return null;
    }

    if (trimmedQuery.length < MIN_SEARCH_LENGTH) {
      return (
        <View style={styles.resultsPanel}>
          <AppText variant="caption" style={styles.panelMessage}>
            Type at least {MIN_SEARCH_LENGTH} characters to search areas.
          </AppText>
        </View>
      );
    }

    if (areaSearchQuery.isFetching) {
      return (
        <View style={[styles.resultsPanel, styles.loadingPanel]}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" style={styles.panelMessage}>
            Searching areas...
          </AppText>
        </View>
      );
    }

    if (areaSearchQuery.isError) {
      const message =
        areaSearchQuery.error instanceof Error
          ? areaSearchQuery.error.message
          : 'Could not search areas.';
      return (
        <View style={styles.resultsPanel}>
          <AppText variant="caption" style={styles.errorMessage}>
            {message.includes('404') || message.toLowerCase().includes('not found')
              ? 'Area search is not available yet. Update the API server and try again.'
              : message}
          </AppText>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.resultsPanel}>
          <AppText variant="caption" style={styles.panelMessage}>
            No areas found for "{trimmedQuery}". Try a nearby neighborhood or city name.
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.resultsPanel}>
        <AppText variant="label" style={styles.resultsHeading}>
          Select an area
        </AppText>
        <FlatList
          data={results}
          keyExtractor={(item) => `${item.latitude}-${item.longitude}-${item.label}`}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          style={styles.resultsList}
          renderItem={({ item, index }) => (
            <Pressable
              style={[styles.resultRow, index === results.length - 1 ? styles.resultRowLast : null]}
              onPress={() => handleSelect(item)}
            >
              <AppText variant="body" style={styles.resultTitle}>
                {item.areaLabel}
              </AppText>
              <AppText variant="caption" style={styles.resultSubtitle} numberOfLines={2}>
                {item.label}
              </AppText>
            </Pressable>
          )}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <AppText variant="label">Vehicle area</AppText>
      <AppText variant="caption" style={styles.hint}>
        Search where the car is usually kept. Only the area name is shown publicly — not your exact
        address.
      </AppText>

      <AppInput
        placeholder="Search area (e.g. Clifton, Karachi)"
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setShowResults(true)}
        autoCapitalize="words"
      />

      {renderResultsPanel()}

      <AppButton
        title="I'm at the vehicle — use this location"
        variant="secondary"
        size="sm"
        loading={gpsLoading}
        onPress={() => {
          void handleUseCurrentLocation();
        }}
      />

      {hasSelection && !showResults ? (
        <AppCard muted style={styles.selectedCard}>
          <AppText variant="label">Selected area</AppText>
          <AppText variant="body">{selectedAreaLabel}</AppText>
          <AppText variant="caption" style={styles.coords}>
            Approx. {latitude}, {longitude}
          </AppText>
        </AppCard>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  hint: {
    color: colors.textSecondary,
  },
  resultsPanel: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  resultsHeading: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    color: colors.textSecondary,
  },
  resultsList: {
    maxHeight: 220,
  },
  loadingPanel: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  panelMessage: {
    color: colors.textSecondary,
    padding: spacing.md,
  },
  errorMessage: {
    color: colors.error,
    padding: spacing.md,
  },
  resultRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.xs,
  },
  resultRowLast: {
    borderBottomWidth: 0,
  },
  resultTitle: {
    fontWeight: '600',
  },
  resultSubtitle: {
    color: colors.textSecondary,
  },
  selectedCard: {
    gap: spacing.xs,
  },
  coords: {
    color: colors.textSecondary,
  },
});
