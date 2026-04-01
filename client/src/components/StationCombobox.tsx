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

type InlineAction = {
  label: string
  onClick: () => void
  icon: React.ReactNode
  disabled?: boolean
}

export function StationCombobox({
  label,
  stations,
  value,
  onChange,
  placeholder = 'Search station...',
  className,
  inlineAction,
}: {
  label: string
  stations: Station[]
  value: Station | null
  onChange: (station: Station) => void
  placeholder?: string
  className?: string
  inlineAction?: InlineAction
}) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')

  const results = React.useMemo(
    () => searchStations(stations, query).slice(0, 40),
    [stations, query],
  )

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold text-foreground/90">{label}</div>
      <Popover open={open} onOpenChange={setOpen}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                'w-full justify-start rounded-2xl bg-background/35 pr-12 backdrop-blur',
                inlineAction && 'pr-24',
                !value && 'text-muted-foreground',
                className,
              )}
            >
              <span className="flex-1 truncate text-left">
                {value ? `${value.name} (${value.crs})` : 'Select a station'}
              </span>
            </Button>
          </PopoverTrigger>
          <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-70" />
          {inlineAction ? (
            <button
              type="button"
              onClick={inlineAction.onClick}
              disabled={inlineAction.disabled}
              aria-label={inlineAction.label}
              title={inlineAction.label}
              className="absolute right-10 top-1/2 z-10 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full border border-border/60 bg-background/70 text-muted-foreground transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {inlineAction.icon}
            </button>
          ) : null}
        </div>
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
    </div>
  )
}
