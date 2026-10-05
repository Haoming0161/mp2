export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  types: string[]
  abilities: string[]
  stats: { name: string; value: number }[]
  image: string
  artwork: string
}

export type SortKey = 'id' | 'name' | 'height' | 'weight'
