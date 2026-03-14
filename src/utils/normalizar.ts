// Elimina acentos y pasa a minúsculas para búsquedas insensibles a diacríticos
// Ejemplo: "Lopez" encuentra "López"
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replaceAll(/\p{Diacritic}/gu, '').toLowerCase()
}
