import { useMemo, useState } from 'react'

import type { Category, Listing } from '@/data/listings'

export type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'popular'

export const SORT_OPTIONS: readonly { value: SortKey; label: string }[] = [
  { value: 'newest', label: '新着順' },
  { value: 'priceAsc', label: '価格の安い順' },
  { value: 'priceDesc', label: '価格の高い順' },
  { value: 'popular', label: 'いいね順' },
]

export interface ListingFilters {
  keyword: string
  category: Category | null
  tags: string[]
  stablecoinOnly: boolean
  sort: SortKey
}

const matchesKeyword = (listing: Listing, keyword: string): boolean => {
  if (!keyword.trim()) return true
  const needle = keyword.trim().toLowerCase()
  return [listing.title, listing.description, listing.category, ...listing.tags]
    .join(' ')
    .toLowerCase()
    .includes(needle)
}

const compareBySort = (a: Listing, b: Listing, sort: SortKey): number => {
  switch (sort) {
    case 'priceAsc':
      return a.price - b.price
    case 'priceDesc':
      return b.price - a.price
    case 'popular':
      return b.likeCount - a.likeCount
    case 'newest':
      return b.listedAt.localeCompare(a.listedAt)
  }
}

/** 絞り込みと並び替えの純粋関数。UI から切り離してテストできる */
export const applyListingFilters = (
  listings: Listing[],
  filters: ListingFilters
): Listing[] =>
  listings
    .filter((listing) => matchesKeyword(listing, filters.keyword))
    .filter((listing) => !filters.category || listing.category === filters.category)
    .filter(
      (listing) =>
        filters.tags.length === 0 ||
        filters.tags.every((tag) => listing.tags.includes(tag))
    )
    .filter((listing) => !filters.stablecoinOnly || listing.acceptsStablecoin)
    .slice()
    .sort((a, b) => compareBySort(a, b, filters.sort))

const INITIAL_FILTERS: ListingFilters = {
  keyword: '',
  category: null,
  tags: [],
  stablecoinOnly: false,
  sort: 'newest',
}

export const useListingFilters = (listings: Listing[]) => {
  const [filters, setFilters] = useState<ListingFilters>(INITIAL_FILTERS)

  const results = useMemo(
    () => applyListingFilters(listings, filters),
    [listings, filters]
  )

  const isFiltered =
    filters.keyword.trim() !== '' ||
    filters.category !== null ||
    filters.tags.length > 0 ||
    filters.stablecoinOnly

  return {
    filters,
    results,
    isFiltered,
    setKeyword: (keyword: string) => setFilters((prev) => ({ ...prev, keyword })),
    setSort: (sort: SortKey) => setFilters((prev) => ({ ...prev, sort })),
    toggleCategory: (category: Category) =>
      setFilters((prev) => ({
        ...prev,
        category: prev.category === category ? null : category,
      })),
    toggleTag: (tag: string) =>
      setFilters((prev) => ({
        ...prev,
        tags: prev.tags.includes(tag)
          ? prev.tags.filter((t) => t !== tag)
          : [...prev.tags, tag],
      })),
    toggleStablecoinOnly: () =>
      setFilters((prev) => ({ ...prev, stablecoinOnly: !prev.stablecoinOnly })),
    reset: () => setFilters(INITIAL_FILTERS),
  }
}
