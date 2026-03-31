"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { executeQuery } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign, CalendarDays, BedDouble, Target, Activity, Coffee, Car, ArrowUp, ArrowDown, Minus } from "lucide-react";

type DbKPIResult = {
  totalrevenue: number;
  adr: number;
  revpar: number;
  occupancy: number;
  alos: number;
  topcategory: string;
  breakfastratio: number;
  parkingratio: number;
};

const buildQuery = (jahr: string, saison: string, daysInPeriod: number) => {
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
    WITH FilteredData AS (
        SELECT 
          r.id,
          r.fruehstueck,
          r.parkplatz,
          k.preis as room_price,
          k.name as kategorie_name,
          GREATEST(1, r.ende::date - r.start::date) as nights,
          COALESCE((SELECT SUM(zl.preis) FROM Zusatzleistung zl WHERE zl.reservierung_id = r.id), 0) as angebote_revenue
        FROM Reservierung r
        JOIN zimmer z ON r.zimmer_id = z.id
        JOIN Kategorie k ON z.kategorie_id = k.id
        WHERE ${whereClauses.join(" AND ")}
    ),
    Aggregations AS (
        SELECT 
          COUNT(id) as total_bookings,
          COALESCE(SUM(nights), 0) as occupied_nights,
          COALESCE(SUM(
            ((room_price + 
             (CASE WHEN fruehstueck THEN 15 ELSE 0 END) + 
             (CASE WHEN parkplatz THEN 10 ELSE 0 END)) * nights) + angebote_revenue
          ), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN fruehstueck THEN 1 ELSE 0 END), 0) as breakfast_count,
          COALESCE(SUM(CASE WHEN parkplatz THEN 1 ELSE 0 END), 0) as parking_count
        FROM FilteredData
    ),
    RoomInfo AS (
        SELECT COUNT(id) as total_rooms FROM zimmer WHERE aktiv = true
    ),
    CategoryStats AS (
        SELECT kategorie_name
        FROM FilteredData
        GROUP BY kategorie_name
        ORDER BY COUNT(id) DESC
        LIMIT 1
    )
    SELECT 
      a.total_revenue::float as totalrevenue,
      CASE WHEN a.occupied_nights > 0 THEN a.total_revenue / a.occupied_nights ELSE 0 END as adr,
      CASE WHEN (ri.total_rooms * ${daysInPeriod}) > 0 THEN a.total_revenue::float / (ri.total_rooms * ${daysInPeriod}) ELSE 0 END as revpar,
      CASE WHEN (ri.total_rooms * ${daysInPeriod}) > 0 THEN (a.occupied_nights::float / (ri.total_rooms * ${daysInPeriod})) * 100 ELSE 0 END as occupancy,
      CASE WHEN a.total_bookings > 0 THEN a.occupied_nights::float / a.total_bookings ELSE 0 END as alos,
      COALESCE((SELECT kategorie_name FROM CategoryStats), 'Keine Daten') as topcategory,
      CASE WHEN a.total_bookings > 0 THEN (a.breakfast_count::float / a.total_bookings) * 100 ELSE 0 END as breakfastratio,
      CASE WHEN a.total_bookings > 0 THEN (a.parking_count::float / a.total_bookings) * 100 ELSE 0 END as parkingratio
    FROM Aggregations a
    CROSS JOIN RoomInfo ri
  `;
};

export default function AnalysenPage() {
  const [filterSaison, setFilterSaison] = useState<string>("Alle");
  const [filterJahr, setFilterJahr] = useState<string>("Alle");

  const daysInPeriod = filterSaison === "Alle" ? 365 : 91;

  const { data: currentDbData = [], isLoading: isLoadingCur } = useQuery({
    queryKey: ["analysen_kpi", filterJahr, filterSaison, daysInPeriod],
    queryFn: () => executeQuery<DbKPIResult[]>(buildQuery(filterJahr, filterSaison, daysInPeriod)),
  });

  const { data: vorjahrDbData = [], isLoading: isLoadingVor } = useQuery({
    queryKey: ["analysen_kpi_vorjahr", filterJahr, filterSaison, daysInPeriod],
    queryFn: () => executeQuery<DbKPIResult[]>(buildQuery((parseInt(filterJahr) - 1).toString(), filterSaison, daysInPeriod)),
    enabled: filterJahr !== "Alle"
  });

  const { data: availableYearsData = [] } = useQuery({
    queryKey: ["available_years"],
    queryFn: () => executeQuery<{yr: number}[]>(`SELECT DISTINCT EXTRACT(YEAR FROM start) as yr FROM Reservierung ORDER BY yr DESC`)
  });

  const availableYears = useMemo(() => {
    return availableYearsData.map(d => d.yr);
  }, [availableYearsData]);

  const isLoadingRes = isLoadingCur || (filterJahr !== "Alle" && isLoadingVor);

  const { metrics, trends, metricsVorjahr } = useMemo(() => {
    const mapDbToMetrics = (dbRow?: DbKPIResult) => {
      if (!dbRow) return null;
      return {
        totalRevenue: dbRow.totalrevenue || 0,
        adr: dbRow.adr || 0,
        revPar: dbRow.revpar || 0,
        occupancy: dbRow.occupancy || 0,
        alos: dbRow.alos || 0,
        trends: {
          topCategory: dbRow.topcategory || "Keine Daten",
          breakfastRatio: dbRow.breakfastratio || 0,
          parkingRatio: dbRow.parkingratio || 0,
        }
      };
    };

    const current = mapDbToMetrics(currentDbData[0]) || {
      totalRevenue: 0, adr: 0, revPar: 0, occupancy: 0, alos: 0,
      trends: { topCategory: "Keine Daten", breakfastRatio: 0, parkingRatio: 0 }
    };

    const vorjahr = filterJahr !== "Alle" ? mapDbToMetrics(vorjahrDbData[0]) : null;

    return { metrics: current, trends: current.trends, metricsVorjahr: vorjahr };
  }, [currentDbData, vorjahrDbData, filterJahr]);

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
