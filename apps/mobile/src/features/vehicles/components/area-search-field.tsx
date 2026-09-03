import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import type { AreaSearchResult } from '@rentacar/shared';
import { useTranslation } from 'react-i18next';
import { AppButton } from '@/components/app-button';
import { AppCard } from '@/components/app-card';
import { AppIcon } from '@/components/app-icon';
import { AppInput } from '@/components/app-input';
import { AppText } from '@/components/app-text';
import { reverseGeocodeArea, useAreaSearchQuery } from '@/api/hooks/use-geocoding';
import {
  readCurrentDeviceLocation,
  requestAndroidLocationPermission,
} from '@/services/location-service';
import { colors, radii, spacing } from '@/theme';
import { showAppAlert } from '@/stores/app-alert-store';

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
  const { t } = useTranslation('vehicles');
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
        showAppAlert(t('locationNeeded'), t('locationNeededBody'));
        return;
      }

      const location = await readCurrentDeviceLocation();
      const resolved = await reverseGeocodeArea(location.latitude, location.longitude);
      setQuery(resolved.areaLabel);
      setShowResults(false);
      onSelect(resolved);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('locationError');
      showAppAlert(t('locationError'), message);
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
            {t('areaMinChars', { count: MIN_SEARCH_LENGTH })}
          </AppText>
        </View>
      );
    }

    if (areaSearchQuery.isFetching) {
      return (
        <View style={[styles.resultsPanel, styles.loadingPanel]}>
          <ActivityIndicator color={colors.primary} />
          <AppText variant="caption" style={styles.panelMessage}>
            {t('areaSearching')}
          </AppText>
        </View>
      );
    }

    if (areaSearchQuery.isError) {
      const message =
        areaSearchQuery.error instanceof Error
          ? areaSearchQuery.error.message
          : t('areaUnavailable');
      return (
        <View style={styles.resultsPanel}>
          <AppText variant="caption" style={styles.errorMessage}>
            {message.includes('404') || message.toLowerCase().includes('not found')
              ? t('areaUnavailable')
              : message}
          </AppText>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.resultsPanel}>
          <AppText variant="caption" style={styles.panelMessage}>
            {t('areaNone', { query: trimmedQuery })}
          </AppText>
        </View>
      );
    }

    return (
      <View style={styles.resultsPanel}>
        <AppText variant="label" style={styles.resultsHeading}>
          {t('areaSelectHeading')}
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
              <View style={styles.resultTitleRow}>
                <AppIcon name="pin" size={16} color={colors.primary} />
                <AppText variant="body" style={styles.resultTitle}>
                  {item.areaLabel}
                </AppText>
              </View>
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
      <AppText variant="label">{t('areaLabel')}</AppText>
      <AppText variant="caption" style={styles.hint}>
        {t('areaHint')}
      </AppText>

      <AppInput
        icon="pin"
        placeholder={t('areaPlaceholder')}
        value={query}
        onChangeText={handleQueryChange}
        onFocus={() => setShowResults(true)}
        autoCapitalize="words"
      />

      {renderResultsPanel()}

      <AppButton
        title={t('useCurrentLocation')}
        icon="pin"
        variant="secondary"
        size="sm"
        loading={gpsLoading}
        onPress={() => {
          void handleUseCurrentLocation();
        }}
      />

      {hasSelection && !showResults ? (
        <AppCard muted style={styles.selectedCard}>
          <AppText variant="label">{t('selectedArea')}</AppText>
          <AppText variant="body">{selectedAreaLabel}</AppText>
          <AppText variant="caption" style={styles.coords}>
            {t('approxCoords', { lat: latitude, lon: longitude })}
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
  resultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultTitle: {
    fontWeight: '600',
    flex: 1,
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
