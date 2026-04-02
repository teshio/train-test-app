import { ArrowUpDown, LoaderCircle, LocateFixed } from 'lucide-react'
import { StationCombobox } from '../../components/StationCombobox'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { STATIONS, type Station } from '../../data/stations'

type SearchFormProps = {
  from: Station | null
  to: Station | null
  loading: boolean
  isLocatingFrom: boolean
  error: string | null
  onFromChange: (station: Station | null) => void
  onToChange: (station: Station | null) => void
  onSearch: () => void
  onSwapStations: () => void
  onReset: () => void
  onUseCurrentLocation: () => void
}

export function SearchForm({
  from,
  to,
  loading,
  isLocatingFrom,
  error,
  onFromChange,
  onToChange,
  onSearch,
  onSwapStations,
  onReset,
  onUseCurrentLocation,
}: SearchFormProps) {
  return (
    <Card className="mt-3 glow scanlines">
      <CardHeader>
        <CardTitle className="text-base">Where are you going?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <StationCombobox
          label="Departing from"
          stations={STATIONS}
          value={from}
          onChange={onFromChange}
          inlineAction={{
            label: 'Use current device location',
            onClick: onUseCurrentLocation,
            disabled: loading || isLocatingFrom,
            icon: isLocatingFrom ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <LocateFixed className="h-4 w-4" />
            ),
          }}
          placeholder="Type a station name or CRS..."
        />

        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={onSwapStations}
            disabled={loading || !from || !to}
            className="rounded-full px-4"
            aria-label="Swap departure and arrival stations"
            title="Swap stations"
          >
            <ArrowUpDown className="h-4 w-4 rotate-90" />
          </Button>
        </div>

        <StationCombobox
          label="Arriving at"
          stations={STATIONS}
          value={to}
          onChange={onToChange}
          placeholder="Type a station name or CRS..."
          className="glow-accent rounded-2xl"
        />

        <div className="grid grid-cols-2 gap-3">
          <Button onClick={onSearch} disabled={loading || !from || !to}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
          <Button variant="outline" onClick={onReset} disabled={loading}>
            Reset
          </Button>
        </div>

        {error ? (
          <div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
            {error}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
