import { LoaderCircle } from 'lucide-react'
import heroImage from '../../assets/hero.png'

type SearchLoadingDialogProps = {
  open: boolean
}

export function SearchLoadingDialog({ open }: SearchLoadingDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(3,6,12,0.8)] px-4 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Searching"
        className="relative w-full max-w-3xl overflow-hidden rounded-[34px] border border-cyan-200/10 bg-[rgba(7,12,20,0.94)] shadow-[0_0_0_1px_rgba(120,220,255,0.1),0_0_90px_rgba(0,229,255,0.12),0_24px_120px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(120,220,255,0.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(255,80,165,0.12),transparent_36%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(120,220,255,0.9),rgba(255,255,255,0))] animate-[electricPulse_1.1s_ease-in-out_infinite]" />
        <div className="absolute inset-y-6 left-6 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(120,220,255,0.85),rgba(255,255,255,0))] opacity-80 animate-[electricPulse_1.3s_ease-in-out_infinite]" />
        <div className="absolute inset-y-6 right-6 w-px bg-[linear-gradient(180deg,rgba(255,255,255,0),rgba(255,80,165,0.7),rgba(255,255,255,0))] opacity-70 animate-[electricPulse_1.5s_ease-in-out_infinite]" />

        <div className="relative h-[360px] overflow-hidden">
          <img
            src={heroImage}
            alt=""
            className="h-full w-full scale-[1.14] object-cover opacity-90 saturate-125 contrast-110"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,18,0.12),rgba(4,10,18,0.82))]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1),transparent_52%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,229,255,0.06),transparent_30%,transparent_70%,rgba(255,80,165,0.06))]" />
          <div className="absolute inset-y-0 left-[-22%] w-[42%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,0.28),rgba(255,255,255,0))] opacity-80 animate-[trainRush_0.95s_linear_infinite]" />
          <div className="absolute inset-y-0 left-[-28%] w-[30%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(0,229,255,0),rgba(0,229,255,0.38),rgba(0,229,255,0))] opacity-90 animate-[trainRush_1.35s_linear_infinite]" />
          <div className="absolute inset-y-0 left-[-35%] w-[22%] skew-x-[-18deg] bg-[linear-gradient(90deg,rgba(255,80,165,0),rgba(255,80,165,0.32),rgba(255,80,165,0))] opacity-70 animate-[trainRush_1.7s_linear_infinite]" />
          <div className="absolute inset-0 animate-[electricFlash_1.8s_steps(1,end)_infinite] bg-[radial-gradient(circle_at_22%_35%,rgba(120,220,255,0.18),transparent_20%),radial-gradient(circle_at_74%_28%,rgba(255,255,255,0.12),transparent_18%),radial-gradient(circle_at_70%_72%,rgba(255,80,165,0.14),transparent_18%)]" />
          <div className="absolute inset-x-0 top-[18%] h-[2px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(120,220,255,0.95),rgba(255,255,255,0))] opacity-90 animate-[scanlineSweep_1.6s_linear_infinite]" />
          <div className="absolute inset-x-0 top-[62%] h-[1px] bg-[linear-gradient(90deg,rgba(255,255,255,0),rgba(255,80,165,0.9),rgba(255,255,255,0))] opacity-70 animate-[scanlineSweep_1.15s_linear_infinite_reverse]" />

          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="rounded-[28px] border border-cyan-200/20 bg-[rgba(7,12,20,0.68)] px-8 py-7 text-center shadow-[0_0_0_1px_rgba(120,220,255,0.08),0_0_40px_rgba(0,229,255,0.16)] backdrop-blur-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/18 text-primary">
                <span className="absolute h-12 w-12 rounded-full border border-primary/25 animate-[statusPulse_1.25s_ease-out_infinite]" />
                <LoaderCircle className="relative h-6 w-6 animate-spin" />
              </div>
              <div className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Searching trains...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
