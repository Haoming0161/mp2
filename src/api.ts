import axios from 'axios'
import type { Pokemon } from './types'

const api = axios.create({ baseURL: 'https://pokeapi.co/api/v2', timeout: 12000 })

interface PokemonResponse {
  id: number
  name: string
  height: number
  weight: number
  types: { type: { name: string } }[]
  abilities: { ability: { name: string } }[]
  stats: { base_stat: number; stat: { name: string } }[]
  sprites: {
    front_default: string | null
    other: { 'official-artwork': { front_default: string | null } }
  }
}

const toPokemon = (item: PokemonResponse): Pokemon => ({
  id: item.id,
  name: item.name,
  height: item.height,
  weight: item.weight,
  types: item.types.map(({ type }) => type.name),
  abilities: item.abilities.map(({ ability }) => ability.name),
  stats: item.stats.map(({ base_stat, stat }) => ({ name: stat.name, value: base_stat })),
  image: item.sprites.front_default ?? '',
  artwork: item.sprites.other['official-artwork'].front_default ?? item.sprites.front_default ?? '',
})

let pendingRequest: Promise<Pokemon[]> | undefined

async function requestKantoPokemon(): Promise<Pokemon[]> {
  const cached = sessionStorage.getItem('kanto-pokemon')
  if (cached) return JSON.parse(cached) as Pokemon[]

  const ids = Array.from({ length: 151 }, (_, index) => index + 1)
  const chunks = Array.from({ length: Math.ceil(ids.length / 20) }, (_, index) => ids.slice(index * 20, index * 20 + 20))
  const results: Pokemon[] = []

  for (const chunk of chunks) {
    const responses = await Promise.all(chunk.map((id) => api.get<PokemonResponse>(`/pokemon/${id}`)))
    results.push(...responses.map(({ data }) => toPokemon(data)))
  }
  sessionStorage.setItem('kanto-pokemon', JSON.stringify(results))
  return results
}

export function fetchKantoPokemon(): Promise<Pokemon[]> {
  pendingRequest ??= requestKantoPokemon().catch((error) => {
    pendingRequest = undefined
    throw error
  })
  return pendingRequest
}
