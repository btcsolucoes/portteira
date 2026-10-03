import { BREEDS, type Breed } from '@equestre/domain';

export const breedLabel = (breed: Breed) => BREEDS.find((b) => b.id === breed)?.label ?? breed;
export const money = (cents: number | null) =>
  cents === null
    ? 'Preço sob consulta'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(cents / 100);
export const eventDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
export const fullDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));
export const birthDate = (iso: string) =>
  new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(iso));
