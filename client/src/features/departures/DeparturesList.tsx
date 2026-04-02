import type { Station } from '../../data/stations'
import { Card } from '../../components/ui/card'
import './departures.css'
import { DepartureCard } from './DepartureCard'
import type { DeparturesResponse } from './types'

type DeparturesListProps = {
  from: Station | null
  to: Station | null
  data: DeparturesResponse
}

export function DeparturesList({ from, to, data }: DeparturesListProps) {
  return (
    <div className="mt-5 space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <div className="text-sm font-semibold">
          {from?.name} <span className="text-muted-foreground">-&gt;</span> {to?.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {data.generatedAt ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}` : ''}
        </div>
      </div>

      {data.filterLocationName || data.filtercrs ? (
        <div className="text-xs text-muted-foreground">
          Filtered toward {data.filterLocationName ?? 'Unknown'}
          {data.filtercrs ? ` (${data.filtercrs})` : ''}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {data.services.length === 0 ? (
          <Card className="p-5 text-center text-sm text-muted-foreground">
            No services found.
          </Card>
        ) : (
          data.services.map((service, index) => (
            <DepartureCard
              key={service.serviceID ?? `${service.std}-${service.destination?.[0]?.locationName}`}
              service={service}
              toName={to?.name}
              filterLocationName={data.filterLocationName}
              filterCrs={data.filtercrs}
              animationDelayMs={index * 90}
              animationDirection={index % 2 === 0 ? 'left' : 'right'}
            />
          ))
        )}
      </div>
    </div>
  )
}
