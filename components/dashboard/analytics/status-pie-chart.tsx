"use client"

import { useMemo } from "react"
import { Cell, Label, Pie, PieChart } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function StatusPieChart({
  data,
}: {
  data: { key: string; label: string; count: number }[]
}) {
  const total = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data])

  const config = useMemo(() => {
    const c: ChartConfig = { count: { label: "Dossiers" } }
    data.forEach((d, i) => {
      c[d.key] = { label: d.label, color: PALETTE[i % PALETTE.length] }
    })
    return c
  }, [data])

  const chartData = data.map((d, i) => ({ ...d, fill: PALETTE[i % PALETTE.length] }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par statut</CardTitle>
        <CardDescription>Distribution des dossiers par état</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <EmptyState />
        ) : (
          <ChartContainer config={config} className="mx-auto aspect-square h-[260px]">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="label" innerRadius={64} strokeWidth={3}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-2xl font-semibold">
                            {total}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy ?? 0) + 22}
                            className="fill-muted-foreground text-xs"
                          >
                            dossiers
                          </tspan>
                        </text>
                      )
                    }
                    return null
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.map((d, i) => (
            <li key={d.key} className="flex items-center gap-2 text-sm">
              <span
                className="size-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                aria-hidden
              />
              <span className="flex-1 truncate text-muted-foreground">{d.label}</span>
              <span className="font-medium tabular-nums">{d.count}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function EmptyState() {
  return (
    <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
      Aucune donnée sur cette période
    </div>
  )
}
