"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const config = {
  crees: { label: "Dossiers créés", color: "var(--chart-1)" },
  termines: { label: "Dossiers terminés", color: "var(--chart-3)" },
} satisfies ChartConfig

export function TrendChart({
  data,
}: {
  data: { label: string; crees: number; termines: number }[]
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Évolution de l&apos;activité</CardTitle>
        <CardDescription>Dossiers créés et finalisés sur la période</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[280px] w-full">
          <AreaChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <defs>
              <linearGradient id="fillCrees" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-crees)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-crees)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillTermines" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-termines)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--color-termines)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              dataKey="crees"
              type="monotone"
              fill="url(#fillCrees)"
              stroke="var(--color-crees)"
              strokeWidth={2}
              stackId="a"
            />
            <Area
              dataKey="termines"
              type="monotone"
              fill="url(#fillTermines)"
              stroke="var(--color-termines)"
              strokeWidth={2}
              stackId="b"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
