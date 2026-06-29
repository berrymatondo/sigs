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
  ca: { label: "Chiffre d'affaires", color: "var(--chart-4)" },
} satisfies ChartConfig

function compact(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 1,
  }).format(value)
}

export function RevenueChart({
  data,
}: {
  data: { label: string; ca: number }[]
}) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Chiffre d&apos;affaires réalisé</CardTitle>
        <CardDescription>Revenus des dossiers validés et terminés</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={config} className="aspect-auto h-[260px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 4, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={52}
              tickFormatter={(v) => compact(Number(v))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value) => compact(Number(value))}
                />
              }
            />
            <Bar dataKey="ca" fill="var(--color-ca)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
