"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const config = {
  count: { label: "Dossiers", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TypeBarChart({
  data,
}: {
  data: { key: string; label: string; count: number }[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dossiers par catégorie</CardTitle>
        <CardDescription>Volume par type de service</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
            Aucune donnée sur cette période
          </div>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
            <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="label"
                tickLine={false}
                axisLine={false}
                width={110}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[0, 6, 6, 0]} barSize={26} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
