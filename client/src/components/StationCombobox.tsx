import { ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import type { Station } from '../data/stations'
import { searchStations } from '../lib/searchStations'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

export function StationCombobox({
  label,
  stations,
  value,
  onChange,
  placeholder = 'Search station…',
  className,
}: {
  label: string
  stations: Station[]
  value: Station | null
  onChange: (station: Station) => void
  placeholder?: string
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(
    () => searchStations(stations, query).slice(0, 40),
    [stations, query],
  )

  return (
    <div className={cn('space-y-2', className)}>
      <div className="text-sm font-semibold text-foreground/90">{label}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between rounded-2xl bg-background/35 backdrop-blur',
              !value && 'text-muted-foreground',
            )}
          >
            <span className="truncate">
              {value ? `${value.name} (${value.crs})` : 'Select a station'}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-70" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2 glow">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={query}
              onValueChange={(v) => setQuery(v)}
            />
            <CommandList className="mt-2">
              <CommandEmpty>No matches.</CommandEmpty>
              <CommandGroup heading="Stations">
                {results.map((s) => (
                  <CommandItem
                    key={s.crs}
                    value={`${s.name} ${s.crs}`}
                    onSelect={() => {
                      onChange(s)
                      setOpen(false)
                      setQuery('')
                    }}
                  >
                    <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                      <div className="truncate">{s.name}</div>
                      <div className="shrink-0 font-mono text-xs text-muted-foreground">
                        {s.crs}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="text-xs text-muted-foreground">
        Pick from the list so we can use the correct CRS code.
      </div>
    </div>
  )
}

