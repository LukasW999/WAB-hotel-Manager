const fs = require('fs');

let sql = `-- Auto-generated mock data for mass reservations\n`;

// 1. Generate 30 new rooms (IDs 7 to 36)
sql += `INSERT INTO zimmer (nummer, aktiv, kategorie_id) VALUES\n`;
const newRooms = [];
const allRooms = [];
// existing rooms from 01-schema-seed
allRooms.push({id: 1, cat: 1}, {id: 2, cat: 1}, {id: 3, cat: 1}, {id: 4, cat: 2}, {id: 5, cat: 2}, {id: 6, cat: 3});

let roomId = 7;
for (let f = 1; f <= 3; f++) {
  for (let r = 4; r <= 13; r++) {
    const nummer = f * 100 + r;
    const cat = f === 3 ? (Math.random() > 0.5 ? 3 : 2) : (Math.random() > 0.7 ? 2 : 1);
    newRooms.push(`(${nummer}, true, ${cat})`);
    allRooms.push({id: roomId, cat: cat});
    roomId++;
  }
}
sql += newRooms.join(',\n') + ';\n\n';

// 2. Generate 50 new guests
const vornamen = ["Michael", "Stefan", "Andreas", "Christian", "Matthias", "Nicole", "Andrea", "Svenja", "Katja", "Sandra", "Thorsten", "Markus", "Petra", "Kerstin", "Daniel", "Stephan", "Martin", "Jan", "Oliver", "Tobias", "Nadine", "Anja", "Melanie", "Tanja", "Claudia", "Silke", "Bettina", "Karin", "Susanne", "Uwe", "Jörg", "Frank", "Bernd", "Holger", "Dirk", "Jens", "Sven", "Lars", "Olaf", "Torsten", "Ralf", "Klaus", "Dieter", "Werner", "Jürgen", "Heinz", "Wolfgang", "Hans", "Karl", "Günter"];
const nachnamen = ["Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann", "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Schröder", "Neumann", "Schwarz", "Zimmermann", "Braun", "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Krause", "Meier", "Lehmann", "Schmid", "Schulze", "Maier", "Köhler", "Herrmann", "König", "Walter", "Mayer", "Huber", "Kaiser", "Fuchs", "Peters", "Lang", "Scholz", "Möller", "Weiß", "Jung", "Hahn", "Schubert", "Vogel"];
const staedte = ["Berlin", "München", "Hamburg", "Köln", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"];

sql += `INSERT INTO Gast (vorname, nachname, email, telefonnummer, strasse, hausnummer, postleitzahl, stadt, land) VALUES\n`;
const newGuests = [];
for (let i = 0; i < 50; i++) {
  const v = vornamen[Math.floor(Math.random() * vornamen.length)];
  const n = nachnamen[Math.floor(Math.random() * nachnamen.length)];
  const stadt = staedte[Math.floor(Math.random() * staedte.length)];
  newGuests.push(`('${v}', '${n}', '${v.toLowerCase()}.${n.toLowerCase()}${i}@example.com', '0151${Math.floor(Math.random()*1000000)}', 'Hauptstraße', '${i+1}', '10115', '${stadt}', 'Deutschland')`);
}
sql += newGuests.join(',\n') + ';\n\n';

// 3. Generate reservations
sql += `INSERT INTO Reservierung (start, ende, gast_id, status_id, zimmer_id, fruehstueck, parkplatz) VALUES\n`;
const reservations = [];

const suiteRooms = allRooms.filter(r => r.cat === 3).map(r => r.id);
const normalRooms = allRooms.filter(r => r.cat !== 3).map(r => r.id);

function randDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// 12 old + 50 new = 62 guests. Give them multiple reservations
for (let gId = 1; gId <= 62; gId++) {
  const numBookings = Math.floor(Math.random() * 4) + 2; // 2 to 5 bookings per guest
  
  for (let b = 0; b < numBookings; b++) {
    let year = Math.random() > 0.5 ? 2025 : 2026;
    const rand = Math.random();
    let dStart, dEnd, isSuite = false, isWinter = false;
    
    if (rand < 0.45) { // 45% summer
      dStart = randDate(new Date(`${year}-07-01`), new Date(`${year}-08-25`));
      isSuite = Math.random() > 0.2; // 80% chance for suite in summer
    } else if (rand < 0.8) { // 35% winter
      if (Math.random() > 0.5) year = 2025;
      dStart = randDate(new Date(`${year}-12-15`), new Date(`${year+1}-01-10`));
      isWinter = true;
    } else { // 20% random
      dStart = randDate(new Date(`${year}-02-01`), new Date(`${year}-11-30`));
      isSuite = Math.random() > 0.8;
    }
    
    const duration = Math.floor(Math.random() * 10) + 2;
    dEnd = new Date(dStart.getTime() + duration * 24 * 60 * 60 * 1000);
    
    let targetRoomId = -1;
    if (isSuite && suiteRooms.length > 0) {
      targetRoomId = suiteRooms[Math.floor(Math.random() * suiteRooms.length)];
    } else {
      targetRoomId = normalRooms[Math.floor(Math.random() * normalRooms.length)];
    }
    
    const fStatus = dEnd < new Date() ? 5 : 2; // Abgereist if past, Bestätigt if future
    const fruehstueck = isWinter ? (Math.random() > 0.05) : (Math.random() > 0.5); // 95% breakfast in winter
    const parkplatz = Math.random() > 0.4;
    
    reservations.push(`('${dStart.toISOString().split('T')[0]}', '${dEnd.toISOString().split('T')[0]}', ${gId}, ${fStatus}, ${targetRoomId}, ${fruehstueck}, ${parkplatz})`);
  }
}

sql += reservations.join(',\n') + ';\n';

fs.writeFileSync('c:\\\\Users\\\\Lukas\\\\Projekte\\\\WAB-hotel-Manager\\\\db\\\\init\\\\02-mock-data.sql', sql);
console.log('Successfully generated 02-mock-data.sql');
