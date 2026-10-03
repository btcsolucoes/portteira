import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import {
  BRAZIL_STATES,
  BREEDS,
  LISTING_CATEGORIES,
  parseBRLPrice,
  type RecommendationPreferences,
} from '@equestre/domain';
import { useMarketplace } from '@/providers/MarketplaceProvider';
import { AppText, Button, Chip, Screen, StateView, useThemedStyles, type Theme } from '@/ui';
import { useTheme } from '@/ui/ThemeProvider';
import { StatePicker } from '@/components/StatePicker';

export default function PreferencesScreen() {
  const { ready } = useMarketplace();
  return ready ? (
    <PreferencesForm />
  ) : (
    <Screen>
      <StateView
        kind="empty"
        title="Carregando suas preferências"
        description="Buscando os dados deste aparelho."
      />
    </Screen>
  );
}
function PreferencesForm() {
  const { theme, styles } = useThemedStyles(createStyles);
  const { preference, setPreference } = useTheme();
  const { state, updatePreferences, clearHistory, restoreHidden, storageError, retryLoad } =
    useMarketplace();
  const [draft, setDraft] = useState<RecommendationPreferences>(state.preferences);
  const [budget, setBudget] = useState(
    state.preferences.maxPriceInCents === undefined
      ? ''
      : (state.preferences.maxPriceInCents / 100).toFixed(2).replace('.', ','),
  );
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  async function save() {
    const cents = !draft.personalized
      ? state.preferences.maxPriceInCents
      : budget.trim()
        ? parseBRLPrice(budget)
        : undefined;
    if (cents === null) {
      setMessage('Confira o valor. Exemplo: 45.000,00. Você também pode deixar em branco.');
      return;
    }
    setSaving(true);
    try {
      await updatePreferences({ ...draft, maxPriceInCents: cents });
      router.navigate('/marketplace');
    } catch {
      setMessage('Não foi possível salvar suas preferências. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }
  async function run(action: () => Promise<void>, success: string) {
    setSaving(true);
    try {
      await action();
      setMessage(success);
    } catch {
      setMessage('Não foi possível salvar a alteração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="title" accessibilityRole="header">
          Preferências
        </AppText>
        <AppText color={theme.colors.muted}>
          Escolha o que você gosta de ver. Tudo aqui é opcional.
        </AppText>
        {storageError && (
          <StateView
            kind="error"
            title="Não foi possível salvar ou carregar"
            description={storageError}
            action={{ label: 'Tentar novamente', onPress: retryLoad }}
          />
        )}
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <AppText variant="heading">Sugestões para você</AppText>
            <AppText color={theme.colors.muted}>
              Mostrar primeiro o que combina com seus interesses.
            </AppText>
          </View>
          <Switch
            accessibilityLabel="Receber sugestões pelos meus interesses"
            value={draft.personalized}
            onValueChange={(personalized) => setDraft({ ...draft, personalized })}
            trackColor={{ true: theme.colors.primary }}
          />
        </View>
        {!draft.personalized && (
          <AppText color={theme.colors.muted}>
            Ao salvar, você verá os anúncios mais recentes e seu histórico será apagado. Seus
            favoritos ficam guardados.
          </AppText>
        )}
        {draft.personalized && (
          <>
            <AppText variant="heading">O que você procura?</AppText>
            <View style={styles.chips}>
              {LISTING_CATEGORIES.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={draft.categories.includes(item.id)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      categories: draft.categories.includes(item.id)
                        ? draft.categories.filter((id) => id !== item.id)
                        : [...draft.categories, item.id],
                    })
                  }
                />
              ))}
            </View>
            <AppText variant="heading">Quais raças você gosta?</AppText>
            <View style={styles.chips}>
              {BREEDS.map((item) => (
                <Chip
                  key={item.id}
                  label={item.label}
                  selected={draft.breeds.includes(item.id)}
                  onPress={() =>
                    setDraft({
                      ...draft,
                      breeds: draft.breeds.includes(item.id)
                        ? draft.breeds.filter((id) => id !== item.id)
                        : [...draft.breeds, item.id],
                    })
                  }
                />
              ))}
            </View>
            <AppText variant="heading">Onde você procura?</AppText>
            <StatePicker
              optional
              value={BRAZIL_STATES.find((uf) => uf === draft.state)}
              disabled={saving}
              onChange={(value) => setDraft({ ...draft, state: value })}
            />
            <AppText variant="heading">Até quanto quer gastar?</AppText>
            <TextInput
              accessibilityLabel="Até quanto quer gastar em reais, opcional"
              placeholder="R$ · Ex.: 45.000,00"
              placeholderTextColor={theme.colors.muted}
              value={budget}
              onChangeText={setBudget}
              keyboardType="decimal-pad"
              style={styles.input}
            />
            <AppText color={theme.colors.muted}>Deixe em branco se ainda não decidiu.</AppText>
          </>
        )}
        {!!message && <AppText accessibilityLiveRegion="polite">{message}</AppText>}
        <Button
          label="Salvar e ver anúncios"
          loading={saving}
          onPress={() => {
            void save();
          }}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: optionsOpen }}
          onPress={() => setOptionsOpen(!optionsOpen)}
          style={styles.selector}
        >
          <AppText variant="label" color={theme.colors.primary}>
            {optionsOpen ? 'Fechar histórico e aparência' : 'Histórico e aparência'}
          </AppText>
        </Pressable>
        {optionsOpen && (
          <>
            <View style={styles.section}>
              <AppText variant="heading">Seu histórico</AppText>
              <AppText color={theme.colors.muted}>
                Suas visitas e favoritos ajudam nas sugestões. Ao limpar o histórico, seus favoritos
                e anúncios ficam guardados.
              </AppText>
              <Button
                variant="secondary"
                disabled={saving}
                label="Limpar histórico de visitas"
                onPress={() => {
                  void run(clearHistory, 'Histórico apagado. Seus favoritos foram mantidos.');
                }}
              />
              <Button
                variant="ghost"
                disabled={saving}
                label={
                  'Voltar a mostrar anúncios ocultos (' +
                  state.events.filter((event) => event.type === 'dismiss').length +
                  ')'
                }
                onPress={() => {
                  void run(restoreHidden, 'Os anúncios ocultos voltaram a aparecer.');
                }}
              />
            </View>
            <View style={styles.section}>
              <AppText variant="heading">Aparência</AppText>
              <View style={styles.chips}>
                {(
                  [
                    { id: 'system', label: 'Do aparelho' },
                    { id: 'light', label: 'Claro' },
                    { id: 'dark', label: 'Escuro' },
                  ] as const
                ).map((item) => (
                  <Chip
                    key={item.id}
                    label={item.label}
                    selected={preference === item.id}
                    onPress={() => setPreference(item.id)}
                  />
                ))}
              </View>
            </View>
          </>
        )}
        <AppText variant="caption" color={theme.colors.muted}>
          Suas escolhas ficam salvas neste aparelho.
        </AppText>
      </ScrollView>
    </Screen>
  );
}
const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: '100%',
      maxWidth: theme.sizes.contentMax,
      alignSelf: 'center',
      padding: 16,
      gap: 16,
      paddingBottom: 32,
    },
    row: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    input: {
      ...theme.typography.body,
      color: theme.colors.text,
      borderColor: theme.colors.border,
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      minHeight: 48,
      backgroundColor: theme.colors.surface,
    },
    selector: {
      minHeight: 52,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.controlBorder,
      borderRadius: 8,
      gap: 4,
      backgroundColor: theme.colors.surface,
    },
    section: { borderTopWidth: 1, borderTopColor: theme.colors.border, paddingTop: 20, gap: 12 },
  });
