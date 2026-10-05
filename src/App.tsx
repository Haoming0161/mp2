import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { fetchKantoPokemon } from './api'
import type { Pokemon, SortKey } from './types'

const titleCase = (value: string) => value.split('-').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ')
const number = (id: number) => `#${String(id).padStart(3, '0')}`

function Header() {
  return <header className="site-header">
    <Link className="brand" to="/">
      <span className="brand-mark" aria-hidden="true"><i /></span>
      <span><b>FIELD NOTES</b><small>KANTO POKÉDEX</small></span>
    </Link>
    <nav aria-label="Main navigation">
      <NavLink to="/list">Index</NavLink>
      <NavLink to="/gallery">Gallery</NavLink>
    </nav>
  </header>
}

function Loading() {
  return <main className="status-page"><span className="loader" /><p>Consulting Professor Oak’s archives…</p></main>
}

function ErrorPage({ retry }: { retry: () => void }) {
  return <main className="status-page"><p className="eyebrow">CONNECTION LOST</p><h1>The tall grass is quiet.</h1><p>We couldn’t reach the PokéAPI. Check your connection and try once more.</p><button className="primary-button" onClick={retry}>Try again</button></main>
}

function PageIntro({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return <div className="page-intro"><div><p className="eyebrow">{label}</p><h1>{title}</h1></div><p>{children}</p></div>
}

function ListView({ pokemon }: { pokemon: Pokemon[] }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortKey>('id')
  const [ascending, setAscending] = useState(true)
  const shown = useMemo(() => pokemon
    .filter((item) => item.name.includes(query.trim().toLowerCase()) || number(item.id).includes(query.trim()))
    .sort((a, b) => {
      const compared = typeof a[sort] === 'string'
        ? String(a[sort]).localeCompare(String(b[sort]))
        : Number(a[sort]) - Number(b[sort])
      return ascending ? compared : -compared
    }), [pokemon, query, sort, ascending])

  return <main>
    <PageIntro label="SPECIMEN INDEX" title="Kanto, catalogued.">Search, sort, and study all 151 original species recorded across the region.</PageIntro>
    <section className="controls" aria-label="List controls">
      <label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or number…" aria-label="Search Pokémon" /></label>
      <label>Sort by<select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}><option value="id">Pokédex number</option><option value="name">Name</option><option value="height">Height</option><option value="weight">Weight</option></select></label>
      <button className="order-button" onClick={() => setAscending((value) => !value)} aria-label={`Sort ${ascending ? 'descending' : 'ascending'}`}><span>{ascending ? '↑' : '↓'}</span>{ascending ? 'Ascending' : 'Descending'}</button>
    </section>
    <div className="result-count"><b>{shown.length}</b> specimens found</div>
    <section className="list" aria-live="polite">
      <div className="list-heading"><span>NO.</span><span>SPECIMEN</span><span>TYPE</span><span>HEIGHT</span><span>WEIGHT</span><span /></div>
      {shown.map((item) => <Link className="list-row" to={`/pokemon/${item.id}`} key={item.id}>
        <span className="mono">{number(item.id)}</span><span className="specimen"><span className="mini-image"><img src={item.image} alt="" /></span><b>{titleCase(item.name)}</b></span>
        <span className="type-list">{item.types.map((type) => <i className={`type type-${type}`} key={type}>{type}</i>)}</span><span>{item.height / 10} m</span><span>{item.weight / 10} kg</span><span className="arrow">→</span>
      </Link>)}
      {!shown.length && <div className="empty"><b>No specimens match that field note.</b><button onClick={() => setQuery('')}>Clear search</button></div>}
    </section>
  </main>
}

function GalleryView({ pokemon }: { pokemon: Pokemon[] }) {
  const types = useMemo(() => [...new Set(pokemon.flatMap((item) => item.types))].sort(), [pokemon])
  const [selected, setSelected] = useState<string[]>([])
  const shown = selected.length ? pokemon.filter((item) => selected.every((type) => item.types.includes(type))) : pokemon
  const toggle = (type: string) => setSelected((current) => current.includes(type) ? current.filter((value) => value !== type) : [...current, type])

  return <main>
    <PageIntro label="VISUAL ARCHIVE" title="The gallery.">Browse official field illustrations and narrow the collection by one or more elemental types.</PageIntro>
    <section className="filter-panel"><div><p className="eyebrow">FILTER BY TYPE</p><button className="clear" disabled={!selected.length} onClick={() => setSelected([])}>Clear all</button></div><div className="chips">{types.map((type) => <button aria-pressed={selected.includes(type)} className={`chip type-${type}`} onClick={() => toggle(type)} key={type}><span />{type}</button>)}</div></section>
    <div className="result-count"><b>{shown.length}</b> illustrations {selected.length > 0 && <span>· matching all selected types</span>}</div>
    <section className="gallery" aria-live="polite">{shown.map((item) => <Link className="card" to={`/pokemon/${item.id}`} key={item.id}><span className="card-number">{number(item.id)}</span><div className="art"><span className="halo" /><img src={item.artwork} alt={titleCase(item.name)} loading="lazy" /></div><div className="card-copy"><h2>{titleCase(item.name)}</h2><div>{item.types.map((type) => <i className={`type type-${type}`} key={type}>{type}</i>)}</div></div><span className="view">VIEW ENTRY&nbsp; →</span></Link>)}</section>
    {!shown.length && <div className="empty"><b>No Pokémon have every selected type.</b><button onClick={() => setSelected([])}>Reset filters</button></div>}
  </main>
}

function DetailView({ pokemon }: { pokemon: Pokemon[] }) {
  const { id } = useParams()
  const location = useLocation()
  const index = pokemon.findIndex((item) => item.id === Number(id))
  if (index < 0) return <Navigate to="/list" replace />
  const item = pokemon[index]
  const previous = pokemon[(index - 1 + pokemon.length) % pokemon.length]
  const next = pokemon[(index + 1) % pokemon.length]
  return <main className="detail" key={location.pathname}>
    <Link to="/gallery" className="back">← &nbsp;BACK TO GALLERY</Link>
    <section className="detail-grid">
      <div className="detail-art"><span className="giant-number">{number(item.id)}</span><span className="detail-halo" /><img src={item.artwork} alt={titleCase(item.name)} /></div>
      <div className="detail-copy"><p className="eyebrow">POKÉDEX ENTRY {number(item.id)}</p><h1>{titleCase(item.name)}</h1><div className="detail-types">{item.types.map((type) => <i className={`type type-${type}`} key={type}>{type}</i>)}</div>
        <div className="measurements"><div><small>HEIGHT</small><b>{item.height / 10} m</b></div><div><small>WEIGHT</small><b>{item.weight / 10} kg</b></div><div><small>ABILITIES</small><b>{item.abilities.map(titleCase).join(', ')}</b></div></div>
        <div className="stats"><p className="eyebrow">BASE STATISTICS</p>{item.stats.map((stat) => <div className="stat" key={stat.name}><span>{titleCase(stat.name)}</span><progress max="255" value={stat.value} aria-label={`${titleCase(stat.name)}: ${stat.value}`} /><b>{stat.value}</b></div>)}</div>
      </div>
    </section>
    <nav className="detail-nav" aria-label="Pokémon navigation"><Link to={`/pokemon/${previous.id}`}><span>←</span><small>PREVIOUS</small><b>{titleCase(previous.name)}</b></Link><span className="ball" /><Link to={`/pokemon/${next.id}`}><small>NEXT</small><b>{titleCase(next.name)}</b><span>→</span></Link></nav>
  </main>
}

export default function App() {
  const [pokemon, setPokemon] = useState<Pokemon[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const load = () => { setState('loading'); fetchKantoPokemon().then((data) => { setPokemon(data); setState('ready') }).catch(() => setState('error')) }
  useEffect(load, [])
  return <div className="app"><Header />{state === 'loading' ? <Loading /> : state === 'error' ? <ErrorPage retry={load} /> : <Routes><Route path="/" element={<Navigate to="/gallery" replace />} /><Route path="/list" element={<ListView pokemon={pokemon} />} /><Route path="/gallery" element={<GalleryView pokemon={pokemon} />} /><Route path="/pokemon/:id" element={<DetailView pokemon={pokemon} />} /><Route path="*" element={<Navigate to="/gallery" replace />} /></Routes>}<footer><span>FIELD NOTES · KANTO REGION</span><span>Data supplied by <a href="https://pokeapi.co/">PokéAPI</a></span></footer></div>
}
