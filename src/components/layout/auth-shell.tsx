import type { ReactNode } from "react";
import { LayoutDashboard, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export function AuthShell({
  children,
  eyebrow,
  title,
  subtitle,
}: {
  children: ReactNode;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Form pane */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <LayoutDashboard className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Dabang</span>
          </div>
          <p className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">{eyebrow}</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      {/* Aurora / brand pane */}
      <div className="relative hidden overflow-hidden bg-[#070B18] lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-32 -right-20 size-[420px] rounded-full bg-[#3D5AFE] opacity-30 blur-[120px]" />
          <div className="absolute bottom-[-140px] left-[-60px] size-[380px] rounded-full bg-[#10B7BE] opacity-25 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        <div className="relative z-10 px-16 pt-20">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur">
            <Sparkles className="size-3.5 text-[#5B7CFF]" />
            Enterprise operations, unified
          </div>
          <h2 className="max-w-md text-3xl leading-tight font-semibold text-white">
            Every product, order and courier in a single command center.
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/50">
            Real-time inventory, delivery tracking and workforce insight — built for teams that move fast.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4 px-16 pb-16">
          {[
            { icon: TrendingUp, label: "Revenue up", value: "+18.2%" },
            { icon: ShieldCheck, label: "Uptime", value: "99.98%" },
            { icon: LayoutDashboard, label: "Live orders", value: "1,204" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
            >
              <stat.icon className="mb-3 size-4 text-[#5B7CFF]" />
              <p className="tabular text-lg font-semibold text-white">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
