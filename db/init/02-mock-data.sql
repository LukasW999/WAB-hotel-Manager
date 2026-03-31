-- Auto-generated mock data for mass reservations

-- 1. Create 30 new rooms (IDs 7 to 36)
INSERT INTO zimmer (nummer, aktiv, kategorie_id) VALUES
(104, true, 2),  (105, true, 1),  (106, true, 1),  (107, true, 1),  (108, true, 1),
(109, true, 1),  (110, true, 1),  (111, true, 2),  (112, true, 2),  (113, true, 1),
(204, true, 2),  (205, true, 2),  (206, true, 2),  (207, true, 1),  (208, true, 1),
(209, true, 1),  (210, true, 1),  (211, true, 2),  (212, true, 2),  (213, true, 1),
(301, true, 3),  (302, true, 3),  (303, true, 3),  (304, true, 3),  (305, true, 3),
(306, true, 3),  (307, true, 2),  (308, true, 2),  (309, true, 2),  (310, true, 3);

-- 2. Create 50 new guests (IDs 13 to 62)
INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse, hausnummer, postleitzahl, stadt, land) VALUES
('Andreas', 'Hoffmann', 'ahoff@mail.de', '01511234100', 'Ringstraße', '1', '10115', 'Berlin', 'Deutschland'),
('Martina', 'Weber', 'm.weber@mail.de', '01511234101', 'Ringstraße', '2', '10115', 'München', 'Deutschland'),
('Jürgen', 'Meyer', 'jmeyer@mail.de', '01511234102', 'Ringstraße', '3', '10115', 'Hamburg', 'Deutschland'),
('Stefanie', 'Wagner', 'swagner@mail.de', '01511234103', 'Ringstraße', '4', '10115', 'Köln', 'Deutschland'),
('Christian', 'Becker', 'cbecker@mail.de', '01511234104', 'Ringstraße', '5', '10115', 'Frankfurt', 'Deutschland'),
('Sabine', 'Schulz', 'sschulz@mail.de', '01511234105', 'Ringstraße', '6', '10115', 'Stuttgart', 'Deutschland'),
('Thomas', 'Hoffmann', 'thoffmann@mail.de', '01511234106', 'Ringstraße', '7', '10115', 'Düsseldorf', 'Deutschland'),
('Monika', 'Schäfer', 'mschaefer@mail.de', '01511234107', 'Ringstraße', '8', '10115', 'Leipzig', 'Deutschland'),
('Michael', 'Koch', 'mkoch@mail.de', '01511234108', 'Ringstraße', '9', '10115', 'Dortmund', 'Deutschland'),
('Karin', 'Bauer', 'kbauer@mail.de', '01511234109', 'Ringstraße', '10', '10115', 'Essen', 'Deutschland'),
('Frank', 'Richter', 'frichter@mail.de', '01511234110', 'Ringstraße', '11', '10115', 'Bremen', 'Deutschland'),
('Petra', 'Klein', 'pklein@mail.de', '01511234111', 'Ringstraße', '12', '10115', 'Dresden', 'Deutschland'),
('Peter', 'Wolf', 'pwolf@mail.de', '01511234112', 'Ringstraße', '13', '10115', 'Hannover', 'Deutschland'),
('Susanne', 'Schröder', 'sschroeder@mail.de', '01511234113', 'Ringstraße', '14', '10115', 'Nürnberg', 'Deutschland'),
('Klaus', 'Neumann', 'kneumann@mail.de', '01511234114', 'Ringstraße', '15', '10115', 'Duisburg', 'Deutschland'),
('Andrea', 'Schwarz', 'aschwarz@mail.de', '01511234115', 'Ringstraße', '16', '10115', 'Bochum', 'Deutschland'),
('Uwe', 'Zimmermann', 'uzimmermann@mail.de', '01511234116', 'Ringstraße', '17', '10115', 'Wuppertal', 'Deutschland'),
('Birgit', 'Braun', 'bbraun@mail.de', '01511234117', 'Ringstraße', '18', '10115', 'Bielefeld', 'Deutschland'),
('Dieter', 'Krüger', 'dkrueger@mail.de', '01511234118', 'Ringstraße', '19', '10115', 'Bonn', 'Deutschland'),
('Ursula', 'Hofmann', 'uhofmann@mail.de', '01511234119', 'Ringstraße', '20', '10115', 'Münster', 'Deutschland'),
('Werner', 'Hartmann', 'whartmann@mail.de', '01511234120', 'Ringstraße', '21', '10115', 'Karlsruhe', 'Deutschland'),
('Kirsten', 'Lange', 'klange@mail.de', '01511234121', 'Ringstraße', '22', '10115', 'Mannheim', 'Deutschland'),
('Bernd', 'Schmitt', 'bschmitt@mail.de', '01511234122', 'Ringstraße', '23', '10115', 'Augsburg', 'Deutschland'),
('Heike', 'Werner', 'hwerner@mail.de', '01511234123', 'Ringstraße', '24', '10115', 'Wiesbaden', 'Deutschland'),
('Heinz', 'Krause', 'hkrause@mail.de', '01511234124', 'Ringstraße', '25', '10115', 'Gelsenkirchen', 'Deutschland'),
('Manuela', 'Meier', 'mmeier@mail.de', '01511234125', 'Ringstraße', '26', '10115', 'Mönchengladbach', 'Deutschland'),
('Ralf', 'Lehmann', 'rlehmann@mail.de', '01511234126', 'Ringstraße', '27', '10115', 'Braunschweig', 'Deutschland'),
('Angela', 'Schmid', 'aschmid@mail.de', '01511234127', 'Ringstraße', '28', '10115', 'Chemnitz', 'Deutschland'),
('Günter', 'Schulze', 'gschulze@mail.de', '01511234128', 'Ringstraße', '29', '10115', 'Kiel', 'Deutschland'),
('Christiane', 'Maier', 'cmaier@mail.de', '01511234129', 'Ringstraße', '30', '10115', 'Aachen', 'Deutschland'),
('Jürgen', 'Köhler', 'jkoehler@mail.de', '01511234130', 'Ringstraße', '31', '10115', 'Halle', 'Deutschland'),
('Gabriele', 'Herrmann', 'gherrmann@mail.de', '01511234131', 'Ringstraße', '32', '10115', 'Magdeburg', 'Deutschland'),
('Karl', 'König', 'kkoenig@mail.de', '01511234132', 'Ringstraße', '33', '10115', 'Freiburg', 'Deutschland'),
('Simone', 'Walter', 'swalter@mail.de', '01511234133', 'Ringstraße', '34', '10115', 'Krefeld', 'Deutschland'),
('Hans', 'Mayer', 'hmayer@mail.de', '01511234134', 'Ringstraße', '35', '10115', 'Lübeck', 'Deutschland'),
('Anja', 'Huber', 'ahuber@mail.de', '01511234135', 'Ringstraße', '36', '10115', 'Oberhausen', 'Deutschland'),
('Sven', 'Kaiser', 'skaiser@mail.de', '01511234136', 'Ringstraße', '37', '10115', 'Erfurt', 'Deutschland'),
('Katrin', 'Fuchs', 'kfuchs@mail.de', '01511234137', 'Ringstraße', '38', '10115', 'Mainz', 'Deutschland'),
('Dirk', 'Peters', 'dpeters@mail.de', '01511234138', 'Ringstraße', '39', '10115', 'Rostock', 'Deutschland'),
('Barbara', 'Lang', 'blang@mail.de', '01511234139', 'Ringstraße', '40', '10115', 'Kassel', 'Deutschland'),
('Udo', 'Scholz', 'uscholz@mail.de', '01511234140', 'Ringstraße', '41', '10115', 'Hagen', 'Deutschland'),
('Sylvia', 'Möller', 'smoeller@mail.de', '01511234141', 'Ringstraße', '42', '10115', 'Hamm', 'Deutschland'),
('Wolfgang', 'Weiß', 'wweiss@mail.de', '01511234142', 'Ringstraße', '43', '10115', 'Saarbrücken', 'Deutschland'),
('Marion', 'Jung', 'mjung@mail.de', '01511234143', 'Ringstraße', '44', '10115', 'Mülheim', 'Deutschland'),
('Joachim', 'Hahn', 'jhahn@mail.de', '01511234144', 'Ringstraße', '45', '10115', 'Potsdam', 'Deutschland'),
('Bärbel', 'Schubert', 'bschubert@mail.de', '01511234145', 'Ringstraße', '46', '10115', 'Ludwigshafen', 'Deutschland'),
('Horst', 'Vogel', 'hvogel@mail.de', '01511234146', 'Ringstraße', '47', '10115', 'Oldenburg', 'Deutschland'),
('Renate', 'Friedrich', 'rfriedrich@mail.de', '01511234147', 'Ringstraße', '48', '10115', 'Leverkusen', 'Deutschland'),
('Rolf', 'Keller', 'rkeller@mail.de', '01511234148', 'Ringstraße', '49', '10115', 'Osnabrück', 'Deutschland'),
('Cornelia', 'Günther', 'cguenther@mail.de', '01511234149', 'Ringstraße', '50', '10115', 'Solingen', 'Deutschland');

-- 3. Create ~100 Reservations focused on Summer (Suites) & Winter (Breakfast)
-- Zimmer Suites: 6 (alter Raum 301), 27 (301 neu), 28, 29, 30, 31, 32, 36 (310) == IDs: 6, 27, 28, 29, 30, 31, 32, 36
-- Zimmer Normal: Rest

INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz) VALUES
-- SOMMER 2025 (Suites heavily booked!)
('2025-07-01', '2025-07-10', 13, 5, 27, false, true),
('2025-07-05', '2025-07-15', 14, 5, 28, false, true),
('2025-07-12', '2025-07-20', 15, 5, 29, false, false),
('2025-07-15', '2025-07-25', 16, 5, 30, true, true),
('2025-07-20', '2025-08-01', 17, 5, 31, false, true),
('2025-07-25', '2025-08-05', 18, 5, 32, false, false),
('2025-08-05', '2025-08-15', 19, 5, 36, false, true),
('2025-08-10', '2025-08-20', 20, 5, 6, false, true),
('2025-08-12', '2025-08-22', 21, 5, 27, true, false),
('2025-08-15', '2025-08-25', 22, 5, 28, false, true),
('2025-07-05', '2025-07-10', 23, 5, 12, false, false), -- Normal room
('2025-08-01', '2025-08-07', 24, 5, 15, true, true),   -- Normal room

-- SOMMER 2026 (Suites heavily booked!)
('2026-07-01', '2026-07-10', 25, 2, 27, false, true),
('2026-07-05', '2026-07-15', 26, 2, 28, false, true),
('2026-07-12', '2026-07-20', 27, 2, 29, false, false),
('2026-07-15', '2026-07-25', 28, 2, 30, true, true),
('2026-07-20', '2026-08-01', 29, 2, 31, false, true),
('2026-07-25', '2026-08-05', 30, 2, 32, false, false),
('2026-08-05', '2026-08-15', 31, 2, 36, false, true),
('2026-08-10', '2026-08-20', 32, 2, 6, false, true),
('2026-08-12', '2026-08-22', 33, 2, 27, true, false),
('2026-08-15', '2026-08-25', 34, 2, 28, false, true),
('2026-07-05', '2026-07-10', 35, 2, 12, false, false), -- Normal room
('2026-08-01', '2026-08-07', 36, 2, 15, true, true),   -- Normal room

-- WINTER 2025/2026 (Almost everyone books Breakfast!)
('2025-12-15', '2025-12-22', 37, 5, 10, true, true),
('2025-12-20', '2025-12-27', 38, 5, 11, true, false),
('2025-12-22', '2025-12-29', 39, 5, 12, true, true),
('2025-12-25', '2026-01-02', 40, 5, 13, true, true),
('2025-12-28', '2026-01-05', 41, 5, 14, true, false),
('2026-01-05', '2026-01-12', 42, 5, 15, true, true),
('2026-01-10', '2026-01-15', 43, 5, 16, true, false),
('2026-01-15', '2026-01-22', 44, 5, 17, true, true),
('2026-02-01', '2026-02-10', 45, 5, 18, true, true),
('2026-02-10', '2026-02-18', 46, 5, 19, true, false),
('2026-02-15', '2026-02-25', 47, 5, 20, true, true),
('2025-12-27', '2026-01-04', 48, 5, 27, true, true),   -- Suite in winter + Breakfast

-- WINTER 2026 (Almost everyone books Breakfast!)
('2026-12-15', '2026-12-22', 49, 1, 10, true, true),
('2026-12-20', '2026-12-27', 50, 1, 11, true, false),
('2026-12-22', '2026-12-29', 51, 1, 12, true, true),
('2026-12-25', '2027-01-02', 52, 1, 13, true, true),
('2026-12-28', '2027-01-05', 53, 1, 14, true, false),
('2026-12-05', '2026-12-12', 54, 1, 15, true, true),
('2026-12-10', '2026-12-15', 55, 1, 16, true, false),

-- FRÜHLING & HERBST 2025 (Mixed)
('2025-03-15', '2025-03-20', 13, 5, 11, false, false),
('2025-04-10', '2025-04-15', 14, 5, 12, true, true),
('2025-05-05', '2025-05-12', 15, 5, 13, false, true),
('2025-09-10', '2025-09-15', 16, 5, 14, true, false),
('2025-10-01', '2025-10-08', 17, 5, 15, false, false),
('2025-11-15', '2025-11-20', 18, 5, 16, true, true),

-- FRÜHLING & HERBST 2026 (Mixed)
('2026-03-15', '2026-03-20', 19, 5, 11, false, false),
('2026-04-10', '2026-04-15', 20, 2, 12, true, true),
('2026-05-05', '2026-05-12', 21, 2, 13, false, true),
('2026-09-10', '2026-09-15', 22, 2, 14, true, false),
('2026-10-01', '2026-10-08', 23, 2, 15, false, false),
('2026-11-15', '2026-11-20', 24, 2, 16, true, true),

-- ZUSÄTZLICHE MEHRFACHBUCHUNGEN (Gäste kommen im Folgejahr wieder)
('2026-07-02', '2026-07-12', 13, 2, 27, false, true), -- Gast 13 wieder im Sommer
('2026-07-06', '2026-07-16', 14, 2, 28, false, true), -- Gast 14 wieder im Sommer
('2026-12-16', '2026-12-23', 37, 1, 10, true, true),  -- Gast 37 wieder im Winter (mit Frühstück)
('2026-12-21', '2026-12-28', 38, 1, 11, true, false); -- Gast 38 wieder im Winter (mit Frühstück)
