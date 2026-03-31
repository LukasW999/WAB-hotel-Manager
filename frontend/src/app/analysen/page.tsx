"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, CalendarDays, BedDouble, Target, Activity, Coffee, Car, ArrowUp, ArrowDown, Minus } from "lucide-react";

type ReservationAnalyticsInfo = {
  id: number;
  start: string;
  ende: string;
  status_id: number;
  status_name: string;
  kategorie_name: string;
  preis: number;
  fruehstueck: boolean;
  parkplatz: boolean;
};

type ZimmerCount = {
  anzahl: number;
};

const buildQuery = (jahr: string, saison: string) => {
  let whereClauses = ["r.status_id != 3"]; // Ignore 'Storniert'

  if (jahr !== "Alle") {
    whereClauses.push(`EXTRACT(YEAR FROM r.start) = ${jahr}`);
  }

  if (saison !== "Alle") {
    if (saison === "Winter") {
      whereClauses.push(`EXTRACT(MONTH FROM r.start) IN (12, 1, 2)`);
    } else if (saison === "Frühling") {
      whereClauses.push(`EXTRACT(MONTH FROM r.start) IN (3, 4, 5)`);
    } else if (saison === "Sommer") {
      whereClauses.push(`EXTRACT(MONTH FROM r.start) IN (6, 7, 8)`);
    } else if (saison === "Herbst") {
      whereClauses.push(`EXTRACT(MONTH FROM r.start) IN (9, 10, 11)`);
    }
  }

  return `
    SELECT r.id, r.start, r.ende, r.status_id, r.fruehstueck, r.parkplatz,
           k.name as kategorie_name, k.preis, s.name as status_name
    FROM Reservierung r
    JOIN zimmer z ON r.zimmer_id = z.id
    JOIN Kategorie k ON z.kategorie_id = k.id
    LEFT JOIN Status s ON r.status_id = s.id
    WHERE ${whereClauses.join(" AND ")}
  `;
};

export default function AnalysenPage() {
  const [filterSaison, setFilterSaison] = useState<string>("Alle");
  const [filterJahr, setFilterJahr] = useState<string>("Alle");

  const { data: currentData = [], isLoading: isLoadingCur } = useQuery({
    queryKey: ["analysen_reservierungen", filterJahr, filterSaison],
    queryFn: () => executeQuery<ReservationAnalyticsInfo[]>(buildQuery(filterJahr, filterSaison)),
  });

  const { data: vorjahrData = [], isLoading: isLoadingVor } = useQuery({
    queryKey: ["analysen_reservierungen_vorjahr", filterJahr, filterSaison],
    queryFn: () => executeQuery<ReservationAnalyticsInfo[]>(buildQuery((parseInt(filterJahr) - 1).toString(), filterSaison)),
    enabled: filterJahr !== "Alle"
  });

  const { data: zimmerData = [] } = useQuery({
    queryKey: ["analysen_zimmer_count"],
    queryFn: () => executeQuery<ZimmerCount[]>("SELECT COUNT(id) as anzahl FROM zimmer WHERE aktiv = true"),
  });

  const { data: availableYearsData = [] } = useQuery({
    queryKey: ["available_years"],
    queryFn: () => executeQuery<{yr: number}[]>(`SELECT DISTINCT EXTRACT(YEAR FROM start) as yr FROM Reservierung ORDER BY yr DESC`)
  });

  const availableYears = useMemo(() => {
    return availableYearsData.map(d => d.yr);
  }, [availableYearsData]);

  const activeRoomsCount = zimmerData[0]?.anzahl || 1;
  const isLoadingRes = isLoadingCur || (filterJahr !== "Alle" && isLoadingVor);

  const { metrics, trends, metricsVorjahr } = useMemo(() => {
    const aggregate = (data: ReservationAnalyticsInfo[]) => {
      let totalRevenue = 0;
      let occupiedNights = 0;
      let totalBookings = data.length;
      let breakfastCount = 0;
      let parkingCount = 0;
      const categoryCounts: Record<string, number> = {};

      data.forEach((r) => {
        const dStart = new Date(r.start);
        const dEnd = new Date(r.ende);
        dStart.setHours(0,0,0,0);
        dEnd.setHours(0,0,0,0);
        
        const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
        const nights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        occupiedNights += nights;
        const roomRev = r.preis * nights;
        const extraRev = (r.fruehstueck ? 15 * nights : 0) + (r.parkplatz ? 10 * nights : 0);
        
        totalRevenue += (roomRev + extraRev);

        if (r.fruehstueck) breakfastCount++;
        if (r.parkplatz) parkingCount++;

        categoryCounts[r.kategorie_name] = (categoryCounts[r.kategorie_name] || 0) + 1;
      });

      // Approximate days in period
      const daysInPeriod = filterSaison === "Alle" ? 365 : 91;
      const availableNights = activeRoomsCount * daysInPeriod;

      const adr = occupiedNights > 0 ? totalRevenue / occupiedNights : 0;
      const revPar = totalRevenue / availableNights;
      const occupancy = availableNights > 0 ? (occupiedNights / availableNights) * 100 : 0;
      const alos = totalBookings > 0 ? occupiedNights / totalBookings : 0;

      let topCat = "Keine Daten";
      let maxCatVal = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCatVal) {
          maxCatVal = count;
          topCat = cat;
        }
      }

      return {
        totalRevenue, adr, revPar, occupancy, alos,
        trends: {
          topCategory: topCat,
          breakfastRatio: totalBookings > 0 ? (breakfastCount / totalBookings) * 100 : 0,
          parkingRatio: totalBookings > 0 ? (parkingCount / totalBookings) * 100 : 0,
        }
      };
    };

    const current = aggregate(currentData);
    const vorjahr = filterJahr !== "Alle" ? aggregate(vorjahrData) : null;

    return { metrics: current, trends: current.trends, metricsVorjahr: vorjahr };
  }, [currentData, vorjahrData, filterSaison, filterJahr, activeRoomsCount]);

  const renderDiff = (current: number, previous: number | null | undefined, reverseColors: boolean = false) => {
    if (previous === null || previous === undefined || previous === 0) return null;
    const diff = current - previous;
    const percentDiff = (diff / previous) * 100;
    
    if (percentDiff > 0) {
      return (
        <Badge variant="outline" className={`mt-2 gap-1 px-2 py-0.5 ${reverseColors ? 'text-rose-600 bg-rose-50 border-rose-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200'}`}>
          <ArrowUp className="w-3 h-3"/> {percentDiff.toFixed(1)}% vs Vorjahr
        </Badge>
      );
    } else if (percentDiff < 0) {
      return (
        <Badge variant="outline" className={`mt-2 gap-1 px-2 py-0.5 ${reverseColors ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-rose-600 bg-rose-50 border-rose-200'}`}>
          <ArrowDown className="w-3 h-3"/> {Math.abs(percentDiff).toFixed(1)}% vs Vorjahr
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="mt-2 gap-1 px-2 py-0.5 text-slate-600 bg-slate-50 border-slate-200">
        <Minus className="w-3 h-3"/> unverändert vs Vorjahr
      </Badge>
    );
  };

  return (
    <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-50/50 dark:bg-slate-950">
      <header className="h-16 flex items-center justify-between px-8 border-b bg-white dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10 shrink-0">
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-indigo-600" /> Analysen & KPIs
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Jahr:</span>
            <Select value={filterJahr} onValueChange={(val) => setFilterJahr(val ?? "Alle")}>
              <SelectTrigger className="w-[120px] bg-white dark:bg-slate-800">
                <SelectValue placeholder="Jahr wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alle">Alle Jahre</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Saison:</span>
            <Select value={filterSaison} onValueChange={(val) => setFilterSaison(val ?? "Alle")}>
              <SelectTrigger className="w-[140px] bg-white dark:bg-slate-800">
                <SelectValue placeholder="Saison wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Alle">Gesamtes Jahr</SelectItem>
                <SelectItem value="Frühling">Frühling</SelectItem>
                <SelectItem value="Sommer">Sommer</SelectItem>
                <SelectItem value="Herbst">Herbst</SelectItem>
                <SelectItem value="Winter">Winter</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="p-8 overflow-auto flex-1 space-y-8">
        
        {isLoadingRes ? (
          <div className="flex items-center justify-center h-64 text-slate-500">Lade Analysedaten...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* RevPAR */}
              <Card className="border-indigo-100 dark:border-indigo-900/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="w-16 h-16 text-indigo-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="font-semibold text-indigo-600 dark:text-indigo-400">RevPAR</CardDescription>
                  <CardTitle className="text-3xl font-bold flex flex-col items-start gap-1">
                    {metrics.revPar.toFixed(2)} €
                    {renderDiff(metrics.revPar, metricsVorjahr?.revPar)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">Revenue Per Available Room. Umsatz pro verfügbarem Zimmer.</p>
                </CardContent>
              </Card>

              {/* ADR */}
              <Card className="border-emerald-100 dark:border-emerald-900/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <DollarSign className="w-16 h-16 text-emerald-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="font-semibold text-emerald-600 dark:text-emerald-400">ADR</CardDescription>
                  <CardTitle className="text-3xl font-bold flex flex-col items-start gap-1">
                    {metrics.adr.toFixed(2)} €
                    {renderDiff(metrics.adr, metricsVorjahr?.adr)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">Average Daily Rate. Durchschnittliche Rate für belegte Zimmer.</p>
                </CardContent>
              </Card>

              {/* Occupancy Rate */}
              <Card className="border-amber-100 dark:border-amber-900/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Activity className="w-16 h-16 text-amber-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="font-semibold text-amber-600 dark:text-amber-400">Auslastung (Occupancy)</CardDescription>
                  <CardTitle className="text-3xl font-bold flex flex-col items-start gap-1">
                    {metrics.occupancy.toFixed(1)} %
                    {renderDiff(metrics.occupancy, metricsVorjahr?.occupancy)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, metrics.occupancy)}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Auslastungsquote (belegte / verfügbare).</p>
                </CardContent>
              </Card>

              {/* ALOS */}
              <Card className="border-cyan-100 dark:border-cyan-900/50 shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <CalendarDays className="w-16 h-16 text-cyan-600" />
                </div>
                <CardHeader className="pb-2">
                  <CardDescription className="font-semibold text-cyan-600 dark:text-cyan-400">ALOS</CardDescription>
                  <CardTitle className="text-3xl font-bold flex flex-col items-start gap-1">
                    {metrics.alos.toFixed(1)} Nächte
                    {renderDiff(metrics.alos, metricsVorjahr?.alos)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">Average Length of Stay. Die durchschnittliche Aufenthaltsdauer pro Buchung.</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-500" /> 
                    Saisonale Trends & Beobachtungen: {filterSaison !== 'Alle' ? filterSaison : 'Gesamtes Jahr'}
                  </CardTitle>
                  <CardDescription>Erkannte Muster basierend auf den Buchungen der gewählten Zeiträume.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                        <BedDouble className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100 border-b border-transparent">Meistgebuchte Zimmerkategorie</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                          Die Kategorie <span className="font-semibold text-slate-900 dark:text-white">"{trends.topCategory}"</span> ist im Betrachtungszeitraum am beliebtesten. 
                          {filterSaison === 'Sommer' && trends.topCategory.toLowerCase().includes('suite') && " Wie typisch für den Sommer, werden hochwertige Suiten häufiger gebucht."}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/40 flex items-center justify-center shrink-0">
                        <Coffee className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="space-y-1 w-full">
                        <p className="font-medium text-slate-800 dark:text-slate-100 flex items-center gap-2">
                          Frühstücks-Quote 
                          {metricsVorjahr && metricsVorjahr.trends && (
                            <span className="text-xs text-slate-400 font-normal ml-auto">(Vorjahr: {metricsVorjahr.trends.breakfastRatio.toFixed(0)}%)</span>
                          )}
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-orange-600">{trends.breakfastRatio.toFixed(0)}%</span>
                          <div className="flex-1 max-w-[200px]">
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div className="bg-orange-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, trends.breakfastRatio)}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 truncate">aller Buchungen inkl. Frühstück</p>
                          </div>
                        </div>
                        {filterSaison === 'Winter' && trends.breakfastRatio > 50 && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 italic mt-1 bg-slate-50/50 p-2 rounded-md border-l-2 border-orange-400">
                            Tipp: Im Winter buchen Gäste sehr häufig das Frühstück dazu. Ein spezielles Winter-Frühstücks-Paket könnte den Umsatz weiter steigern.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-slate-800 dark:text-slate-100">Parkplatz-Nachfrage</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          <span className="font-semibold text-blue-600">{trends.parkingRatio.toFixed(0)}%</span> der Gäste reisen in diesem Zeitraum mit dem Auto an und buchen einen Stellplatz.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm bg-gradient-to-br from-slate-900 to-slate-800 text-white border-0">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">Performance - {filterJahr !== 'Alle' ? filterJahr : 'Alle Jahre'}</CardTitle>
                  <CardDescription className="text-slate-400">Finanzielle Gesamtperformance im gewählten Zeitraum.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col justify-center h-full pb-10">
                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium text-slate-300 uppercase tracking-wider">Errechneter Gesamt-Umsatz</p>
                    <p className="text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                      {metrics.totalRevenue.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </p>
                    {metricsVorjahr && (
                       <div className="flex justify-center mt-2">
                         {renderDiff(metrics.totalRevenue, metricsVorjahr.totalRevenue)}
                       </div>
                    )}
                    <p className="text-xs text-slate-400 max-w-xs mx-auto pt-6">Basiert auf den gebuchten Zimmerkategorien und hinzugebuchten Extras (Parkplatz, Frühstück).</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
