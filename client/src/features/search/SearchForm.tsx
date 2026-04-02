import { useState } from 'react'
import {
  ArrowUpDown,
  ChevronsUpDown,
  History,
  LoaderCircle,
  LocateFixed,
} from 'lucide-react'
import { StationCombobox } from '../../components/StationCombobox'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover'
import { STATIONS, type Station } from '../../data/stations'
import { cn } from '../../lib/utils'
import type { RecentSearch } from './useJourneySearch'

type SearchFormProps = {
  from: Station | null
  to: Station | null
  recentSearches: RecentSearch[]
  loading: boolean
  isLocatingFrom: boolean
  error: string | null
  onFromChange: (station: Station | null) => void
  onToChange: (station: Station | null) => void
  onSearch: () => void
  onSwapStations: () => void
  onReset: () => void
  onUseCurrentLocation: () => void
  onRecentSearchSelect: (searchId: string) => void
}

type RecentSearchPickerProps = {
  recentSearches: RecentSearch[]
  disabled?: boolean
  onSelect: (searchId: string) => void
}

function RecentSearchPicker({
  recentSearches,
  disabled,
  onSelect,
}: RecentSearchPickerProps) {
  const [open, setOpen] = useState(false)

  if (!recentSearches.length) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        <History className="h-4 w-4 text-primary" />
        Previous searches
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'w-full justify-between rounded-2xl bg-background/35 text-left backdrop-blur',
              !recentSearches.length && 'text-muted-foreground',
            )}
          >
            <span className="truncate">Choose a previous search...</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 glow">
          <Command>
            <CommandInput placeholder="Search previous journeys..." />
            <CommandList className="mt-2">
              <CommandEmpty>No previous searches found.</CommandEmpty>
              <CommandGroup heading="Recent routes">
                {recentSearches.map((search) => (
                  <CommandItem
                    key={search.id}
                    value={`${search.from.name} ${search.from.crs} ${search.to.name} ${search.to.crs}`}
                    onSelect={() => {
                      onSelect(search.id)
                      setOpen(false)
                    }}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="truncate font-medium text-foreground">
                        {search.from.name} to {search.to.name}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {search.from.crs} - {search.to.crs}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function SearchForm({
  from,
  to,
  recentSearches,
  loading,
  isLocatingFrom,
  error,
  onFromChange,
  onToChange,
  onSearch,
  onSwapStations,
  onReset,
  onUseCurrentLocation,
  onRecentSearchSelect,
}: SearchFormProps) {
  return (
    <Card className="mt-3 glow scanlines">
      <CardHeader>
        <CardTitle className="text-base">Where are you going?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RecentSearchPicker
          recentSearches={recentSearches}
          disabled={loading}
          onSelect={onRecentSearchSelect}
        />

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
