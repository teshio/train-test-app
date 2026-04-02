import { DeparturesList } from '../departures/DeparturesList'
import { SearchForm } from './SearchForm'
import { SearchLoadingDialog } from './SearchLoadingDialog'
import type { JourneySearchModel } from './useJourneySearch'

type SearchPageProps = {
  search: JourneySearchModel
}

export function SearchPage({ search }: SearchPageProps) {
  return (
    <>
      <SearchLoadingDialog open={search.showSearchDialog} />

      <div className="mx-auto max-w-xl">
        <SearchForm
          from={search.from}
          to={search.to}
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
        />

        {search.data ? (
          <DeparturesList from={search.from} to={search.to} data={search.data} />
        ) : null}
      </div>
    </>
  )
}
