import { lazy, Suspense, useState } from 'react'
import { Zap } from 'lucide-react'
import { Button } from './components/ui/button'
import { STATIONS, type Station } from './data/stations'
import { SearchPage } from './features/search/SearchPage'
import { useJourneySearch } from './features/search/useJourneySearch'

const StationMap = lazy(async () => {
  const module = await import('./features/map/StationMap')
  return { default: module.StationMap }
})

function App() {
  const [activeSection, setActiveSection] = useState<'search' | 'stationMap'>('search')
  const search = useJourneySearch()
  const highlightedStations = [search.from, search.to].filter(
    (station): station is Station => Boolean(station),
  )

  return (
    <div className="min-h-screen electric-bg text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2">
              <div className="pulse-ring grid h-10 w-10 place-items-center rounded-2xl bg-primary/15 glow">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xl font-extrabold tracking-tight">wheresmetrain</div>
                <div className="text-xs text-muted-foreground">
                  Live UK train departures and calling points
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-xl justify-center gap-2">
          <Button
            variant={activeSection === 'search' ? undefined : 'outline'}
            onClick={() => setActiveSection('search')}
          >
            Search
          </Button>
          <Button
            variant={activeSection === 'stationMap' ? undefined : 'outline'}
            onClick={() => setActiveSection('stationMap')}
          >
            Station Map
          </Button>
        </div>

        {activeSection === 'search' ? (
          <SearchPage search={search} />
        ) : (
          <Suspense
            fallback={
              <div className="mt-5 rounded-3xl border border-border/60 bg-background/20 px-6 py-10 text-center text-sm text-muted-foreground">
                Loading map...
              </div>
            }
          >
            <StationMap
              stations={STATIONS}
              highlightedStations={highlightedStations}
              liveServices={search.liveServicePositions}
            />
          </Suspense>
        )}

        <div className="mx-auto mt-6 max-w-xl text-xs text-muted-foreground">
          &copy; 2026 wheresmetrain.com. All rights reserved.
        </div>
      </div>
    </div>
  )
}

export default App
