import {
  DEMO_PROVENANCE,
  eventSummarySchema,
  horseSchema,
  listingSummarySchema,
  makeHorseId,
  socialPostSchema,
  type EventSummary,
  type Horse,
  type HorseReference,
  type ListingSummary,
  type SocialPost,
} from './models';

// All people, properties, animals, prices, records and events below are fictional.
// They are fixed fixtures for interface review, never association or live data.
export const EVENTS: EventSummary[] = [
  {
    id: 'event-vale-sereno',
    title: 'Encontro de Marchadores do Vale',
    description:
      'Uma manhã de marcha, troca de experiências e encontro entre criadores. Evento fictício para demonstração.',
    startsAt: '2026-10-17T08:00:00-03:00',
    endsAt: '2026-10-18T17:00:00-03:00',
    location: { city: 'Gravatá', state: 'PE' },
    venue: 'Parque do Vale Sereno · fictício',
    organizer: 'Núcleo do Vale · demonstração',
    category: 'gathering',
    modality: 'Marcha',
    breeds: ['mangalarga-marchador'],
    imageKey: 'pasture',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'event-copa-horizonte',
    title: 'Copa Horizonte de Três Tambores',
    description:
      'Dois dias dedicados à técnica e à parceria entre cavalo e cavaleiro. Programação demonstrativa.',
    startsAt: '2026-10-24T09:00:00-03:00',
    endsAt: '2026-10-25T18:00:00-03:00',
    location: { city: 'Campinas', state: 'SP' },
    venue: 'Arena Horizonte · fictícia',
    organizer: 'Equipe Horizonte · demonstração',
    category: 'competition',
    modality: 'Três tambores',
    breeds: ['quarto-de-milha'],
    imageKey: 'arena',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'event-arabe-fonte',
    title: 'Exposição Árabe da Fonte Clara',
    description: 'Morfologia, criação e conversas sobre o cavalo árabe em uma exposição fictícia.',
    startsAt: '2026-11-07T09:00:00-03:00',
    endsAt: '2026-11-08T16:00:00-03:00',
    location: { city: 'Sorocaba', state: 'SP' },
    venue: 'Espaço Fonte Clara · fictício',
    organizer: 'Criadores da Fonte · demonstração',
    category: 'exhibition',
    modality: 'Morfologia',
    breeds: ['arabe'],
    imageKey: 'portrait',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'event-rotas-serra',
    title: 'Rotas da Serra',
    description:
      'Encontro equestre com conversas sobre manejo e uma programação de campo. Conteúdo fictício.',
    startsAt: '2026-11-14T07:30:00-03:00',
    endsAt: '2026-11-14T16:30:00-03:00',
    location: { city: 'São João del-Rei', state: 'MG' },
    venue: 'Fazenda Rotas da Serra · fictícia',
    organizer: 'Coletivo Rotas · demonstração',
    category: 'gathering',
    modality: 'Cavalgada',
    breeds: ['mangalarga-marchador', 'quarto-de-milha', 'arabe'],
    imageKey: 'pasture',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'event-prova-abril',
    title: 'Prova de Trabalho de Abril',
    description: 'Uma programação demonstrativa de provas de trabalho e manejo responsável.',
    startsAt: '2026-11-21T08:00:00-03:00',
    endsAt: '2026-11-21T18:00:00-03:00',
    location: { city: 'Caruaru', state: 'PE' },
    venue: 'Centro Equestre de Abril · fictício',
    organizer: 'Centro de Abril · demonstração',
    category: 'competition',
    modality: 'Trabalho',
    breeds: ['quarto-de-milha'],
    imageKey: 'arena',
    provenance: DEMO_PROVENANCE,
  },
].map((event) => eventSummarySchema.parse(event));

export const LISTINGS: ListingSummary[] = [
  {
    id: 'listing-marchadora',
    title: 'Égua marchadora de pelagem tordilha',
    description:
      'Anúncio fictício. Égua de cinco anos, manejo diário e trabalho de marcha. Nenhuma oferta ou contato comercial real.',
    category: 'horse',
    priceInCents: 4800000,
    currency: 'BRL',
    location: { city: 'Gravatá', state: 'PE' },
    seller: 'Haras Campo da Brisa · fictício',
    breed: 'mangalarga-marchador',
    imageKey: 'portrait',
    status: 'active',
    publishedAt: '2026-09-15T11:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'listing-quarto',
    title: 'Quarto de Milha para trabalho',
    description:
      'Anúncio fictício de um castrado alazão de seis anos. Informações e preço servem apenas à revisão da interface.',
    category: 'horse',
    priceInCents: 6500000,
    currency: 'BRL',
    location: { city: 'Campinas', state: 'SP' },
    seller: 'Fazenda Horizonte Manso · fictícia',
    breed: 'quarto-de-milha',
    imageKey: 'pasture',
    status: 'active',
    publishedAt: '2026-09-14T15:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'listing-arabe',
    title: 'Potra Árabe de pelagem castanha',
    description:
      'Anúncio de demonstração de uma potra de três anos. Dados inventados, sem correspondência com registros oficiais.',
    category: 'horse',
    priceInCents: null,
    currency: 'BRL',
    location: { city: 'Sorocaba', state: 'SP' },
    seller: 'Haras Riacho de Luz · fictício',
    breed: 'arabe',
    imageKey: 'portrait',
    status: 'active',
    publishedAt: '2026-09-13T10:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'listing-sela',
    title: 'Sela de passeio artesanal',
    description:
      'Equipamento fictício para demonstrar a categoria. Assento de 16 polegadas e conjunto de estribos.',
    category: 'equipment',
    priceInCents: 280000,
    currency: 'BRL',
    location: { city: 'Belo Horizonte', state: 'MG' },
    seller: 'Oficina Linha do Campo · fictícia',
    imageKey: 'arena',
    status: 'active',
    publishedAt: '2026-09-12T09:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'listing-kit',
    title: 'Kit de escovas para manejo',
    description:
      'Kit demonstrativo com escovas e acessórios de higiene. Produto e preço fictícios.',
    category: 'product',
    priceInCents: 18900,
    currency: 'BRL',
    location: { city: 'Recife', state: 'PE' },
    seller: 'Casa do Manejo · fictícia',
    imageKey: 'pasture',
    status: 'active',
    publishedAt: '2026-09-11T09:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'listing-fotografia',
    title: 'Fotografia equestre no seu haras',
    description:
      'Serviço fictício para apresentar a categoria de profissionais. Sem agenda ou contratação real.',
    category: 'service',
    priceInCents: null,
    currency: 'BRL',
    location: { city: 'São Paulo', state: 'SP' },
    seller: 'Clara Campos · personagem fictícia',
    imageKey: 'portrait',
    status: 'active',
    publishedAt: '2026-09-10T09:00:00-03:00',
    provenance: DEMO_PROVENANCE,
  },
].map((listing) => listingSummarySchema.parse(listing));

export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post-encontro',
    author: {
      id: 'profile-marina',
      name: 'Marina Vale',
      subtitle: 'Criadora · perfil fictício',
      initials: 'MV',
    },
    body: 'Tem encontro marcado em Gravatá. Uma manhã para conversar sobre marcha, conhecer novas histórias e rever quem compartilha a mesma paixão.',
    publishedAt: '2026-09-16T08:30:00-03:00',
    imageKey: 'pasture',
    likes: 124,
    comments: 18,
    attachment: { type: 'event', id: 'event-vale-sereno' },
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'post-marchadora',
    author: {
      id: 'profile-campo-brisa',
      name: 'Haras Campo da Brisa',
      subtitle: 'Haras · perfil fictício',
      initials: 'CB',
    },
    body: 'Calma no manejo, presença no campo. Conheça os detalhes da nossa marchadora no anúncio de demonstração.',
    publishedAt: '2026-09-16T07:15:00-03:00',
    imageKey: 'portrait',
    likes: 86,
    comments: 9,
    attachment: { type: 'listing', id: 'listing-marchadora' },
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'post-copa',
    author: {
      id: 'profile-horizonte',
      name: 'Equipe Horizonte',
      subtitle: 'Organizador · perfil fictício',
      initials: 'EH',
    },
    body: 'O cuidado começa muito antes da pista. Estamos preparando cada detalhe para dois dias de esporte e boas conversas na Copa Horizonte.',
    publishedAt: '2026-09-15T16:30:00-03:00',
    imageKey: 'arena',
    likes: 57,
    comments: 6,
    attachment: { type: 'event', id: 'event-copa-horizonte' },
    provenance: DEMO_PROVENANCE,
  },
  {
    id: 'post-fotografia',
    author: {
      id: 'profile-clara',
      name: 'Clara Campos',
      subtitle: 'Fotógrafa · perfil fictício',
      initials: 'CC',
    },
    body: 'A luz da manhã e o tempo do cavalo. Compartilho aqui um pouco do olhar que guia cada ensaio no campo.',
    publishedAt: '2026-09-15T09:30:00-03:00',
    imageKey: 'pasture',
    likes: 93,
    comments: 12,
    attachment: { type: 'listing', id: 'listing-fotografia' },
    provenance: DEMO_PROVENANCE,
  },
].map((post) => socialPostSchema.parse(post));

function reference(externalId: string, name: string): HorseReference {
  return {
    id: makeHorseId('equestre-demo', externalId),
    name,
    registryNumber: `DEMO-${externalId.toUpperCase()}`,
  };
}

const atlas = reference('mm-101', 'Atlas do Vale Sereno');
const aurora = reference('mm-102', 'Aurora do Vale Sereno');
const horizonte = reference('qm-201', 'Horizonte de Abril');
const brisa = reference('qm-202', 'Brisa de Abril');
const zafir = reference('ar-301', 'Zafir da Fonte Clara');
const noura = reference('ar-302', 'Noura da Fonte Clara');
const cedro = reference('ancestor-mm-11', 'Cedro do Vale Sereno');
const lua = reference('ancestor-mm-12', 'Lua da Campina');
const vento = reference('ancestor-mm-21', 'Vento da Campina');
const rosa = reference('ancestor-mm-22', 'Rosa do Vale');
const norte = reference('ancestor-mm-23', 'Norte da Serra');
const seda = reference('ancestor-mm-24', 'Seda do Campo');

export interface AncestryRecord {
  horse: HorseReference;
  sire: HorseReference | null;
  dam: HorseReference | null;
}

// A bounded graph holds the illustrative ancestors without presenting them as
// additional searchable registry records. Missing relationships stay null.
export const MOCK_ANCESTRY: readonly AncestryRecord[] = [
  { horse: atlas, sire: cedro, dam: lua },
  { horse: aurora, sire: atlas, dam: reference('ancestor-mm-13', 'Íris da Campina') },
  { horse: cedro, sire: vento, dam: rosa },
  { horse: lua, sire: norte, dam: seda },
  {
    horse: vento,
    sire: reference('ancestor-mm-31', 'Céu do Vale'),
    dam: reference('ancestor-mm-32', 'Alva da Serra'),
  },
  {
    horse: rosa,
    sire: reference('ancestor-mm-33', 'Rio da Campina'),
    dam: reference('ancestor-mm-34', 'Flor do Campo'),
  },
  {
    horse: norte,
    sire: reference('ancestor-mm-35', 'Luar da Serra'),
    dam: reference('ancestor-mm-36', 'Terra do Vale'),
  },
  {
    horse: seda,
    sire: reference('ancestor-mm-37', 'Tempo do Campo'),
    dam: reference('ancestor-mm-38', 'Sol da Campina'),
  },
  {
    horse: horizonte,
    sire: reference('ancestor-qm-11', 'Cedro de Abril'),
    dam: reference('ancestor-qm-12', 'Estrela de Abril'),
  },
  { horse: brisa, sire: horizonte, dam: reference('ancestor-qm-13', 'Manhã de Abril') },
  {
    horse: zafir,
    sire: reference('ancestor-ar-11', 'Nadir da Fonte'),
    dam: reference('ancestor-ar-12', 'Laila da Fonte'),
  },
  { horse: noura, sire: zafir, dam: reference('ancestor-ar-13', 'Amira da Fonte') },
];

function parents(horse: HorseReference): Pick<Horse, 'sire' | 'dam'> {
  const record = MOCK_ANCESTRY.find((item) => item.horse.id === horse.id);
  return { sire: record?.sire ?? null, dam: record?.dam ?? null };
}

export const HORSES: Horse[] = [
  {
    ...atlas,
    externalSource: 'equestre-demo',
    externalId: 'mm-101',
    breed: 'mangalarga-marchador',
    sex: 'male',
    birthDate: '2017-10-12',
    coat: 'Tordilho',
    location: { city: 'Gravatá', state: 'PE' },
    breeder: 'Haras Vale Sereno · fictício',
    owner: 'Haras Vale Sereno · fictício',
    ...parents(atlas),
    awards: [{ title: 'Destaque de marcha · premiação fictícia', year: 2025 }],
    results: [{ event: 'Encontro Fictício do Vale', date: '2025-10-18', placement: 2 }],
    lineage: 'Vale Sereno · linhagem fictícia',
    imageKey: 'portrait',
    provenance: DEMO_PROVENANCE,
  },
  {
    ...aurora,
    externalSource: 'equestre-demo',
    externalId: 'mm-102',
    breed: 'mangalarga-marchador',
    sex: 'female',
    birthDate: '2022-03-08',
    coat: 'Castanha',
    location: { city: 'Gravatá', state: 'PE' },
    breeder: 'Haras Vale Sereno · fictício',
    ...parents(aurora),
    awards: [],
    results: [],
    lineage: 'Vale Sereno · linhagem fictícia',
    imageKey: 'pasture',
    provenance: DEMO_PROVENANCE,
  },
  {
    ...horizonte,
    externalSource: 'equestre-demo',
    externalId: 'qm-201',
    breed: 'quarto-de-milha',
    sex: 'male',
    birthDate: '2016-05-20',
    coat: 'Alazão',
    location: { city: 'Campinas', state: 'SP' },
    breeder: 'Fazenda de Abril · fictícia',
    ...parents(horizonte),
    awards: [{ title: 'Destaque de trabalho · premiação fictícia', year: 2024 }],
    results: [],
    lineage: 'De Abril · linhagem fictícia',
    imageKey: 'arena',
    provenance: DEMO_PROVENANCE,
  },
  {
    ...brisa,
    externalSource: 'equestre-demo',
    externalId: 'qm-202',
    breed: 'quarto-de-milha',
    sex: 'female',
    birthDate: '2021-09-03',
    coat: 'Baia',
    location: { city: 'Caruaru', state: 'PE' },
    breeder: 'Fazenda de Abril · fictícia',
    ...parents(brisa),
    awards: [],
    results: [],
    lineage: 'De Abril · linhagem fictícia',
    imageKey: 'pasture',
    provenance: DEMO_PROVENANCE,
  },
  {
    ...zafir,
    externalSource: 'equestre-demo',
    externalId: 'ar-301',
    breed: 'arabe',
    sex: 'male',
    birthDate: '2015-11-17',
    coat: 'Tordilho',
    location: { city: 'Sorocaba', state: 'SP' },
    breeder: 'Haras Fonte Clara · fictício',
    ...parents(zafir),
    awards: [],
    results: [{ event: 'Exposição Fictícia da Fonte', date: '2025-06-14', placement: 1 }],
    lineage: 'Fonte Clara · linhagem fictícia',
    imageKey: 'portrait',
    provenance: DEMO_PROVENANCE,
  },
  {
    ...noura,
    externalSource: 'equestre-demo',
    externalId: 'ar-302',
    breed: 'arabe',
    sex: 'female',
    birthDate: '2021-02-25',
    coat: 'Castanha',
    location: { city: 'Sorocaba', state: 'SP' },
    breeder: 'Haras Fonte Clara · fictício',
    ...parents(noura),
    awards: [],
    results: [],
    lineage: 'Fonte Clara · linhagem fictícia',
    imageKey: 'portrait',
    provenance: DEMO_PROVENANCE,
  },
].map((horse) => horseSchema.parse(horse));
