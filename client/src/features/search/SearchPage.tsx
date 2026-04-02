import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { DeparturesList } from '../departures/DeparturesList'
import { SearchForm } from './SearchForm'
import { SearchLoadingDialog } from './SearchLoadingDialog'
import type { JourneySearchModel } from './useJourneySearch'

type SearchPageProps = {
  search: JourneySearchModel
}

export function SearchPage({ search }: SearchPageProps) {
  const [isSearchFormOpen, setIsSearchFormOpen] = useState(true)

  useEffect(() => {
    if (search.data) {
      setIsSearchFormOpen(false)
      return
    }

    setIsSearchFormOpen(true)
  }, [search.data])

  const searchSummary =
    search.from && search.to ? `${search.from.name} -> ${search.to.name}` : 'Search journey'

  return (
    <>
      <SearchLoadingDialog open={search.showSearchDialog} />

      <div className="mx-auto max-w-xl">
        {isSearchFormOpen ? (
          <SearchForm
            from={search.from}
            to={search.to}
            recentSearches={search.recentSearches}
            loading={search.loading}
            isLocatingFrom={search.isLocatingFrom}
            error={search.error}
            onFromChange={search.setFrom}
            onToChange={search.setTo}
            onSearch={() => {
              void search.search()
            }}
            onSwapStations={search.swapStations}
            onReset={search.reset}
            onUseCurrentLocation={search.useCurrentLocation}
            onRecentSearchSelect={search.applyRecentSearch}
          />
        ) : (
          <Card className="mt-3 glow">
            <CardContent className="flex flex-col gap-4 p-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/75">
                  <Search className="h-3.5 w-3.5" />
                  Search
                </div>
                <div className="mt-1 truncate text-sm font-semibold text-foreground">
                  {searchSummary}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsSearchFormOpen(true)}
                className="w-full justify-between"
              >
                Edit search
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}

        {isSearchFormOpen && search.data ? (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSearchFormOpen(false)}
              className="w-full justify-between"
            >
              Hide search
              <ChevronUp className="h-4 w-4" />
            </Button>
          </div>
        ) : null}

        {search.data ? (
          <DeparturesList from={search.from} to={search.to} data={search.data} />
        ) : null}
      </div>
    </>
  )
}
