import { useEffect, useId, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  BackHandler,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { router, Stack } from 'expo-router';
import {
  BRAZIL_STATES,
  LISTING_CATEGORIES,
  createAssociationProvider,
  parseBRLPrice,
  type AssociationAnimal,
  type AssociationId,
  type Breed,
  type ListingCategory,
  type NewListingInput,
} from '@equestre/domain';
import { useMarketplace } from '@/providers/MarketplaceProvider';
import {
  AppText,
  Button,
  Chip,
  IconButton,
  Screen,
  SearchField,
  useThemedStyles,
  type Theme,
} from '@/ui';
import { StatePicker, type BrazilState } from '@/components/StatePicker';
import { money } from '@/lib/format';

const SUPPORTED_BREEDS: { id: Breed; label: string; association: AssociationId }[] = [
  { id: 'mangalarga-marchador', label: 'Mangalarga Marchador', association: 'ABCCMM' },
  { id: 'quarto-de-milha', label: 'Quarto de Milha', association: 'ABQM' },
];

type Errors = Partial<
  Record<'title' | 'name' | 'price' | 'city' | 'state' | 'seller' | 'description', string>
>;
type Lookup =
  | { status: 'idle' | 'loading' }
  | { status: 'unavailable' | 'error'; message: string }
  | { status: 'available'; animals: AssociationAnimal[] };

function FormField({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string }) {
  const { theme, styles } = useThemedStyles(createStyles);
  const labelId = useId();
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <AppText variant="label" nativeID={labelId}>
        {label}
      </AppText>
      <TextInput
        {...props}
        accessibilityLabel={label}
        accessibilityLabelledBy={labelId}
        accessibilityHint={error ?? hint}
        placeholderTextColor={theme.colors.muted}
        selectionColor={theme.colors.primary}
        allowFontScaling
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.field,
          props.multiline && styles.multiline,
          focused && styles.focused,
          Boolean(error) && styles.fieldError,
        ]}
      />
      {error ? (
        <AppText variant="caption" color={theme.colors.danger}>
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color={theme.colors.muted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export default function CreateListingScreen() {
  const { theme, styles } = useThemedStyles(createStyles);
  const { addListing, ready, storageError, retryLoad } = useMarketplace();
  const scrollRef = useRef<ScrollView>(null);
  const savingRef = useRef(false);
  const [step, setStep] = useState(0);
  const [registryOpen, setRegistryOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ListingCategory>('horse');
  const [breed, setBreed] = useState<Breed>('mangalarga-marchador');
  const [horseName, setHorseName] = useState('');
  const [registryNumber, setRegistryNumber] = useState('');
  const [selectedAnimal, setSelectedAnimal] = useState<AssociationAnimal>();
  const [lookupResult, setLookupResult] = useState<{ key: string; value: Lookup }>();
  const [retry, setRetry] = useState(0);
  const [price, setPrice] = useState('');
  const [negotiable, setNegotiable] = useState(false);
  const [city, setCity] = useState('');
  const [state, setState] = useState<BrazilState>();
  const [seller, setSeller] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const stepTitles = ['O que você anuncia?', 'Preço e localização', 'Confira e salve'];
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [step]);
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saving) return true;
      if (step > 0) {
        setStep((value) => value - 1);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [step, saving]);

  function back() {
    if (saving) return;
    if (step > 0) {
      Keyboard.dismiss();
      setErrors({});
      setStep(step - 1);
    } else if (router.canGoBack()) router.back();
    else router.replace('/marketplace');
  }
  const association = SUPPORTED_BREEDS.find((item) => item.id === breed)?.association ?? 'ABCCMM';
  const lookupKey = JSON.stringify([association, horseName, registryNumber, retry]);
  const lookup: Lookup =
    category !== 'horse' || horseName.trim().length < 3 || selectedAnimal
      ? { status: 'idle' }
      : lookupResult?.key === lookupKey
        ? lookupResult.value
        : { status: 'loading' };

  useEffect(() => {
    const controller = new AbortController();
    let current = true;
    if (category !== 'horse' || horseName.trim().length < 3 || selectedAnimal) {
      return () => {
        current = false;
        controller.abort();
      };
    }
    const publish = (value: Lookup) => {
      if (current && !controller.signal.aborted) setLookupResult({ key: lookupKey, value });
    };
    const timer = setTimeout(() => {
      void createAssociationProvider(association)
        .search(horseName.trim(), controller.signal)
        .then((result) => {
          if (!current || controller.signal.aborted) return;
          if (result.status === 'unavailable') {
            publish({ status: 'unavailable', message: result.message });
          } else {
            const registry = registryNumber.trim().toLocaleUpperCase('pt-BR');
            publish({
              status: 'available',
              animals: result.animals.filter(
                (animal) =>
                  animal.identity.association === association &&
                  (!registry ||
                    animal.identity.registryNumber.toLocaleUpperCase('pt-BR') === registry),
              ),
            });
          }
        })
        .catch(() => {
          if (current && !controller.signal.aborted) {
            publish({
              status: 'error',
              message:
                'Não foi possível consultar a associação agora. Você pode salvar o anúncio sem selo.',
            });
          }
        });
    }, 450);
    return () => {
      current = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [association, category, horseName, registryNumber, lookupKey, selectedAnimal]);

  function clearError(field: keyof Errors) {
    setErrors((previous) => ({ ...previous, [field]: undefined }));
    setSaveError('');
  }

  function continueForm() {
    const nextErrors: Errors = {};
    if (step === 0) {
      if (title.trim().length < 3) nextErrors.title = 'Escreva um título. Ex.: Égua à venda.';
      if (category === 'horse' && horseName.trim().length < 2)
        nextErrors.name = 'Escreva o nome do animal.';
    } else {
      if (!negotiable && parseBRLPrice(price) === null)
        nextErrors.price =
          'Confira o preço. Ex.: 45.000,00. Você também pode escolher Preço a combinar.';
      if (city.trim().length < 2) nextErrors.city = 'Escreva o nome da cidade.';
      if (!state) nextErrors.state = 'Escolha um estado na lista.';
    }
    setErrors(nextErrors);
    Keyboard.dismiss();
    if (Object.keys(nextErrors).length) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      AccessibilityInfo.announceForAccessibility(Object.values(nextErrors).join(' '));
      return;
    }
    setStep(step + 1);
  }

  async function save() {
    if (savingRef.current || !ready) return;
    const nextErrors: Errors = {};
    const priceInCents = negotiable ? null : parseBRLPrice(price);
    const normalizedState = BRAZIL_STATES.find((uf) => uf === state);
    if (title.trim().length < 3)
      nextErrors.title = 'Informe um título com pelo menos 3 caracteres.';
    if (category === 'horse' && horseName.trim().length < 2)
      nextErrors.name = 'Informe o nome do animal, com pelo menos 2 caracteres.';
    if (!negotiable && priceInCents === null)
      nextErrors.price =
        'Confira o preço. Ex.: 45.000,00. Você também pode escolher Preço a combinar.';
    if (city.trim().length < 2) nextErrors.city = 'Informe uma cidade com pelo menos 2 caracteres.';
    if (!normalizedState) nextErrors.state = 'Escolha um estado na lista.';
    if (seller.trim().length < 2)
      nextErrors.seller = 'Informe o anunciante com pelo menos 2 caracteres.';
    if (description.trim().length < 10)
      nextErrors.description = 'Descreva o anúncio com pelo menos 10 caracteres.';
    setErrors(nextErrors);
    setSaveError('');
    if (Object.keys(nextErrors).length || !normalizedState) {
      setStep(
        nextErrors.title || nextErrors.name
          ? 0
          : nextErrors.price || nextErrors.city || nextErrors.state
            ? 1
            : 2,
      );
      Keyboard.dismiss();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      AccessibilityInfo.announceForAccessibility(
        'Revise os campos indicados. Seus dados foram mantidos.',
      );
      return;
    }

    const input: NewListingInput = {
      title: title.trim(),
      description: description.trim(),
      category,
      priceInCents: priceInCents ?? null,
      location: { city: city.trim(), state: normalizedState },
      seller: seller.trim(),
      ...(category === 'horse'
        ? {
            breed,
            horse: {
              name: horseName.trim(),
              association,
              ...(registryNumber.trim() ? { registryNumber: registryNumber.trim() } : {}),
            },
          }
        : {}),
    };
    savingRef.current = true;
    setSaving(true);
    try {
      const listing = await addListing(input);
      router.replace({ pathname: '/marketplace/listing/[id]', params: { id: listing.id } });
    } catch {
      setSaveError(
        'Não foi possível salvar neste aparelho. Seus dados continuam preenchidos; tente novamente.',
      );
      AccessibilityInfo.announceForAccessibility(
        'Não foi possível salvar o anúncio. Seus dados foram mantidos.',
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return (
    <Screen edges={['left', 'right', 'bottom']}>
      <Stack.Screen
        options={{
          title: 'Criar anúncio',
          gestureEnabled: step === 0 && !saving,
          headerLeft: () => (
            <IconButton
              name="arrow-left"
              label="Voltar"
              visibleLabel="Voltar"
              labelPosition="right"
              disabled={saving}
              onPress={back}
            />
          ),
        }}
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.intro}>
            <AppText variant="caption" color={theme.colors.muted} accessibilityLiveRegion="polite">
              Etapa {step + 1} de 3
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {stepTitles[step]}
            </AppText>
            {Object.values(errors).some(Boolean) && (
              <AppText
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                color={theme.colors.danger}
              >
                {Object.values(errors).filter(Boolean).join(' ')}
              </AppText>
            )}
          </View>

          {step === 0 && (
            <>
              <View style={styles.section}>
                <AppText variant="label">Categoria</AppText>
                <View style={styles.chips}>
                  {LISTING_CATEGORIES.map((item) => (
                    <Chip
                      key={item.id}
                      label={item.label}
                      selected={category === item.id}
                      disabled={saving}
                      onPress={() => {
                        setCategory(item.id);
                        setSelectedAnimal(undefined);
                        clearError('name');
                      }}
                    />
                  ))}
                </View>
                <FormField
                  label="Título do anúncio"
                  placeholder="Ex.: Égua Mangalarga Marchador à venda"
                  value={title}
                  maxLength={120}
                  editable={!saving}
                  error={errors.title}
                  onChangeText={(value) => {
                    setTitle(value);
                    clearError('title');
                  }}
                />
              </View>

              {category === 'horse' && (
                <View style={styles.section}>
                  <AppText variant="label">Raça do animal</AppText>
                  <View style={styles.chips}>
                    {SUPPORTED_BREEDS.map((item) => (
                      <Chip
                        key={item.id}
                        label={item.label}
                        selected={breed === item.id}
                        disabled={saving}
                        onPress={() => {
                          if (item.id === breed) return;
                          setBreed(item.id);
                          setSelectedAnimal(undefined);
                          setRegistryNumber('');
                        }}
                      />
                    ))}
                  </View>
                  <SearchField
                    label="Nome do animal na associação"
                    placeholder="Digite o nome completo do animal"
                    value={horseName}
                    onChangeText={(value) => {
                      if (saving) return;
                      setHorseName(value.slice(0, 160));
                      setSelectedAnimal(undefined);
                      clearError('name');
                    }}
                  />
                  {errors.name && (
                    <AppText variant="caption" color={theme.colors.danger}>
                      {errors.name}
                    </AppText>
                  )}
                  <Button
                    variant="ghost"
                    label={
                      registryOpen
                        ? 'Fechar número de registro'
                        : registryNumber
                          ? 'Alterar registro do animal'
                          : 'Adicionar registro do animal (opcional)'
                    }
                    onPress={() => setRegistryOpen(!registryOpen)}
                    disabled={saving}
                  />
                  {registryOpen && (
                    <FormField
                      label={`Registro na ${association} (opcional)`}
                      placeholder="Número do registro"
                      value={registryNumber}
                      maxLength={80}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      editable={!saving}
                      hint="Ajuda a diferenciar animais com o mesmo nome."
                      onChangeText={(value) => {
                        setRegistryNumber(value);
                        setSelectedAnimal(undefined);
                      }}
                    />
                  )}
                  {horseName.trim().length >= 3 && (
                    <View style={styles.lookup}>
                      <AppText variant="label">Consulta à {association}</AppText>
                      {selectedAnimal ? (
                        <View style={styles.fieldGroup}>
                          <AppText>{selectedAnimal.name}</AppText>
                          <AppText variant="caption">
                            {selectedAnimal.identity.association} · registro{' '}
                            {selectedAnimal.identity.registryNumber}
                          </AppText>
                          <AppText variant="caption" color={theme.colors.muted}>
                            Animal selecionado. Os selos dependem da confirmação de resultados
                            oficiais.
                          </AppText>
                          <Button
                            label="Escolher outro animal"
                            variant="ghost"
                            disabled={saving}
                            onPress={() => setSelectedAnimal(undefined)}
                          />
                        </View>
                      ) : lookup.status === 'loading' ? (
                        <AppText variant="caption" accessibilityLiveRegion="polite">
                          Consultando o nome na associação…
                        </AppText>
                      ) : lookup.status === 'unavailable' || lookup.status === 'error' ? (
                        <View style={styles.fieldGroup}>
                          <AppText variant="caption" accessibilityLiveRegion="polite">
                            A consulta à {association} está indisponível. Você pode continuar e
                            salvar sem selo.
                          </AppText>
                          {lookup.status === 'error' && (
                            <Button
                              label="Tentar consulta novamente"
                              variant="secondary"
                              disabled={saving}
                              onPress={() => setRetry((value) => value + 1)}
                            />
                          )}
                        </View>
                      ) : lookup.status === 'available' ? (
                        <View style={styles.fieldGroup}>
                          <AppText variant="caption" accessibilityLiveRegion="polite">
                            {lookup.animals.length
                              ? 'Confira o registro e selecione o animal correto. Nomes iguais podem pertencer a animais diferentes.'
                              : 'Nenhum animal encontrado com esses dados. Confira o nome e o registro ou salve sem selo.'}
                          </AppText>
                          {lookup.animals.slice(0, 10).map((animal) => (
                            <Button
                              key={`${animal.identity.association}:${animal.identity.registryNumber}`}
                              label={`${animal.name} · ${animal.identity.association} · registro ${animal.identity.registryNumber}`}
                              variant="secondary"
                              disabled={saving}
                              onPress={() => {
                                setHorseName(animal.name);
                                setRegistryNumber(animal.identity.registryNumber);
                                setSelectedAnimal(animal);
                                clearError('name');
                              }}
                            />
                          ))}
                          {lookup.animals.length > 10 && (
                            <AppText variant="caption">
                              Há mais resultados. Complete o nome ou informe o registro para refinar
                              a consulta.
                            </AppText>
                          )}
                        </View>
                      ) : (
                        <AppText variant="caption" color={theme.colors.muted}>
                          A consulta começa ao digitar pelo menos 3 caracteres. O nome, sozinho, não
                          confirma títulos de campeão.
                        </AppText>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <View style={styles.chips}>
                <Chip
                  label="Informar preço"
                  selected={!negotiable}
                  disabled={saving}
                  onPress={() => {
                    setNegotiable(false);
                    clearError('price');
                  }}
                />
                <Chip
                  label="Preço a combinar"
                  selected={negotiable}
                  disabled={saving}
                  onPress={() => {
                    setNegotiable(true);
                    clearError('price');
                  }}
                />
              </View>
              {!negotiable && (
                <FormField
                  label="Preço em reais (R$)"
                  placeholder="45.000,00"
                  keyboardType="decimal-pad"
                  value={price}
                  maxLength={22}
                  editable={!saving}
                  error={errors.price}
                  onChangeText={(value) => {
                    setPrice(value);
                    clearError('price');
                  }}
                />
              )}
              <FormField
                label="Cidade"
                placeholder="Ex.: Belo Horizonte"
                value={city}
                maxLength={100}
                editable={!saving}
                error={errors.city}
                onChangeText={(value) => {
                  setCity(value);
                  clearError('city');
                }}
              />
              <AppText variant="label">Estado</AppText>
              <StatePicker
                value={state}
                disabled={saving}
                onChange={(value) => {
                  setState(value);
                  clearError('state');
                }}
              />
              {!!errors.state && <AppText color={theme.colors.danger}>{errors.state}</AppText>}
            </View>
          )}

          {step === 2 && (
            <>
              <View style={styles.lookup}>
                <AppText variant="heading">{title.trim()}</AppText>
                <AppText>{money(negotiable ? null : parseBRLPrice(price))}</AppText>
                <AppText>
                  {city.trim()}, {state}
                </AppText>
                {category === 'horse' && (
                  <AppText>
                    {horseName.trim()} · {association}
                  </AppText>
                )}
                <Button
                  variant="ghost"
                  label="Alterar dados do anúncio"
                  onPress={() => setStep(0)}
                  disabled={saving}
                />
              </View>
              <View style={styles.section}>
                <FormField
                  label="Nome do anunciante"
                  placeholder="Seu nome ou nome do haras"
                  value={seller}
                  maxLength={100}
                  editable={!saving}
                  error={errors.seller}
                  onChangeText={(value) => {
                    setSeller(value);
                    clearError('seller');
                  }}
                />
                <FormField
                  label="Descrição"
                  placeholder="Como é o que você está vendendo? Conte os detalhes que ajudam o comprador."
                  value={description}
                  multiline
                  maxLength={4000}
                  editable={!saving}
                  error={errors.description}
                  onChangeText={(value) => {
                    setDescription(value);
                    clearError('description');
                  }}
                />
              </View>
              <AppText color={theme.colors.muted}>
                Nesta prévia, o anúncio fica salvo só neste aparelho. Ele ainda não aparece para
                outras pessoas.
              </AppText>
            </>
          )}
          <View style={styles.actions}>
            {!ready && (
              <AppText variant="caption" accessibilityLiveRegion="polite">
                Preparando os anúncios deste aparelho…
              </AppText>
            )}
            {storageError && (
              <View style={styles.fieldGroup}>
                {!saveError && (
                  <AppText accessibilityRole="alert" color={theme.colors.danger}>
                    {storageError}
                  </AppText>
                )}
                <Button
                  label="Tentar carregar os dados novamente"
                  variant="secondary"
                  disabled={!ready || saving}
                  onPress={() => {
                    setSaveError('');
                    retryLoad();
                  }}
                />
              </View>
            )}
            {Boolean(saveError) && (
              <AppText
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                color={theme.colors.danger}
              >
                {saveError}
              </AppText>
            )}
          </View>
        </ScrollView>
        <View style={styles.stepActions}>
          {step > 0 && (
            <Button
              style={{ flex: 1 }}
              label="Voltar"
              variant="secondary"
              disabled={saving}
              onPress={back}
            />
          )}
          <Button
            style={{ flex: 2 }}
            label={step === 2 ? 'Salvar anúncio' : 'Continuar'}
            loading={saving}
            disabled={!ready || !!storageError}
            onPress={() => {
              if (step < 2) continueForm();
              else void save();
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    content: { padding: theme.space.md, paddingBottom: theme.space.xl, gap: theme.space.lg },
    intro: { gap: theme.space.sm },
    section: { gap: theme.space.compact },
    fieldGroup: { gap: theme.space.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm },
    notice: {
      padding: theme.space.compact,
      borderRadius: theme.radius.sm,
      backgroundColor: theme.colors.subtle,
    },
    lookup: {
      padding: theme.space.md,
      gap: theme.space.sm,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    field: {
      ...theme.typography.body,
      color: theme.colors.text,
      minHeight: theme.sizes.touch,
      paddingHorizontal: theme.space.compact,
      paddingVertical: theme.space.sm,
      borderWidth: 1,
      borderRadius: theme.components.field.radius,
      borderColor: theme.components.field.border,
      backgroundColor: theme.components.field.background,
    },
    multiline: { minHeight: 144, textAlignVertical: 'top' },
    focused: { borderColor: theme.components.field.focus },
    fieldError: { borderColor: theme.colors.danger },
    actions: { gap: theme.space.sm },
    stepActions: {
      flexDirection: 'row',
      gap: 8,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
  });
