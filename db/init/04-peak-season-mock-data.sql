-- Generiert extrem viele Gäste und Buchungen, um eine 70%+ Auslastung in Peak-Zeiten (Sommer/Winter) zu erzeugen

DO $$ 
DECLARE
  v_gast_cnt int;
  v_room_cnt int;
  v_res_date date;
  v_days int;
BEGIN
  -- 1. Massig neue Gäste generieren (150 Stück) um für die vielen Buchungen unterschiedliche User zu haben
  INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse, hausnummer, postleitzahl, stadt, land)
  SELECT 
    vornamen[1 + trunc(random() * (array_length(vornamen, 1) - 1))::int],
    nachnamen[1 + trunc(random() * (array_length(nachnamen, 1) - 1))::int],
    'gast_peak_' || generate_series || '_' || trunc(random()*10000)::text || '@example.com',
    '017' || trunc(random()*10000000)::text,
    'Ferienstraße',
    (trunc(random()*150) + 1)::text,
    '10115',
    staedte[1 + trunc(random() * (array_length(staedte, 1) - 1))::int],
    'Deutschland'
  FROM 
    generate_series(1, 150),
    (SELECT ARRAY['Thomas','Alexander','Sarah','Laura','Felix','Julia','Maximilian','Anna','David','Lisa', 'Lukas', 'Sophie', 'Leon', 'Marie'] as vornamen) v,
    (SELECT ARRAY['Müller','Schmidt','Schneider','Fischer','Weber','Meyer','Wagner','Becker','Hoffmann','Schulz', 'Koch', 'Bauer', 'Richter'] as nachnamen) n,
    (SELECT ARRAY['Berlin','Hamburg','München','Köln','Frankfurt','Stuttgart','Düsseldorf','Dortmund','Essen','Leipzig'] as staedte) s;

  -- Holen uns die aktuellen Bestände für Random-Zuweisungen
  SELECT count(*) INTO v_gast_cnt FROM Gast;
  SELECT count(*) INTO v_room_cnt FROM zimmer;

  IF v_gast_cnt < 10 OR v_room_cnt < 10 THEN
     RETURN; -- Abbruch falls Fehler beim Seed
  END IF;

  -- 2. Sommer 2025 (1. Juli bis 31. Aug = 62 Tage). Bei 36 Zimmern = 2232 verfügbare Nächte. 
  -- 70% = ca. 1560 Nächte. Bei ø 5 Tagen Aufenthalt = ~310 Buchungen
  FOR i IN 1..310 LOOP
     v_res_date := DATE '2025-07-01' + trunc(random() * 55)::int;
     v_days := trunc(random() * 6 + 2)::int; -- 2 bis 8 Tage
     
     INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz)
     VALUES (
       v_res_date,
       v_res_date + v_days,
       (trunc(random() * v_gast_cnt) + 1)::int,
       5, -- Abgereist (da in Vergangenheit)
       (trunc(random() * v_room_cnt) + 1)::int,
       random() > 0.6,
       random() > 0.3
     );
  END LOOP;

  -- 3. Winter 2025/2026 (15. Dez bis 31. Jan = 47 Tage). Bei 36 Zimmern = 1692 verfügbare Nächte.
  -- 70% = ca. 1184 Nächte. Bei ø 5 Tagen Aufenthalt = ~235 Buchungen
  FOR i IN 1..235 LOOP
     v_res_date := DATE '2025-12-15' + trunc(random() * 40)::int;
     v_days := trunc(random() * 6 + 2)::int;
     
     INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz)
     VALUES (
       v_res_date,
       v_res_date + v_days,
       (trunc(random() * v_gast_cnt) + 1)::int,
       5, 
       (trunc(random() * v_room_cnt) + 1)::int,
       random() > 0.05, -- Im Winter extrem hohe Frühstücksquote
       random() > 0.3
     );
  END LOOP;

  -- 4. Sommer 2026 (1. Juli bis 31. Aug) -> zukünftig / aktuell, gemischter Status
  FOR i IN 1..320 LOOP
     v_res_date := DATE '2026-07-01' + trunc(random() * 55)::int;
     v_days := trunc(random() * 6 + 2)::int; 
     
     INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz)
     VALUES (
       v_res_date,
       v_res_date + v_days,
       (trunc(random() * v_gast_cnt) + 1)::int,
       (CASE WHEN random() > 0.3 THEN 2 ELSE 1 END), -- 70% Bestätigt, 30% Anfrage
       (trunc(random() * v_room_cnt) + 1)::int,
       random() > 0.6,
       random() > 0.3
     );
  END LOOP;
  
  -- 5. Winter 2026/2027
  FOR i IN 1..240 LOOP
     v_res_date := DATE '2026-12-15' + trunc(random() * 40)::int;
     v_days := trunc(random() * 5 + 2)::int; 
     
     INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz)
     VALUES (
       v_res_date,
       v_res_date + v_days,
       (trunc(random() * v_gast_cnt) + 1)::int,
       1, -- Anfrage
       (trunc(random() * v_room_cnt) + 1)::int,
       random() > 0.05, 
       random() > 0.3
     );
  END LOOP;

END $$;
