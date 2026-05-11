export const LOCATIONS = [
  { name:'Casino',         emoji:'🎰', accent:'#c9a227', roles:['Dealer','High Roller','Pit Boss','Cocktail Server','Card Counter','Security Guard','Croupier','Loan Shark'] },
  { name:'Submarine',      emoji:'🤿', accent:'#1a4f9e', roles:['Captain','Sonar Operator','Engineer','Navigator','Cook','Torpedo Tech','Medic','Diver'] },
  { name:'Space Station',  emoji:'🚀', accent:'#5b21b6', roles:['Commander','Astronaut','Flight Engineer','Mission Specialist','Life Support Tech','Pilot','Geologist','Comms Officer'] },
  { name:'Hospital',       emoji:'🏥', accent:'#0284c7', roles:['Doctor','Nurse','Surgeon','Patient','Anesthesiologist','Janitor','Radiologist','Receptionist'] },
  { name:'School',         emoji:'🏫', accent:'#d97706', roles:['Teacher','Principal','Student','Cafeteria Worker','Janitor','Librarian','Gym Coach','Counselor'] },
  { name:'Restaurant',     emoji:'🍽️', accent:'#dc2626', roles:['Head Chef','Waiter','Dishwasher','Sommelier','Food Critic','Hostess','Sous Chef','Health Inspector'] },
  { name:'Airport',        emoji:'✈️', accent:'#2563eb', roles:['Pilot','Flight Attendant','Security Officer','Customs Agent','Baggage Handler','Air Traffic Controller','Gate Agent','Mechanic'] },
  { name:'Beach',          emoji:'🏖️', accent:'#ea580c', roles:['Lifeguard','Surfer','Tourist','Ice Cream Vendor','Volleyball Player','Fisherman','Jet Ski Instructor','Sunbather'] },
  { name:'Military Base',  emoji:'🪖', accent:'#4d7c0f', roles:['General','Sergeant','Drill Instructor','Sniper','Comms Officer','Medic','Intelligence Officer','Cook'] },
  { name:'Movie Set',      emoji:'🎬', accent:'#b91c1c', roles:['Director','Lead Actor','Stunt Double','Camera Operator','Producer','Makeup Artist','Grip','Screenwriter'] },
  { name:'Circus',         emoji:'🎪', accent:'#c2410c', roles:['Ringmaster','Acrobat','Clown','Lion Tamer','Trapeze Artist','Fire Breather','Tightrope Walker','Ticket Collector'] },
  { name:'Museum',         emoji:'🏛️', accent:'#92400e', roles:['Curator','Art Restorer','Tour Guide','Security Guard','Archaeologist','Donor','Janitor','Visiting Scholar'] },
  { name:'Cruise Ship',    emoji:'🚢', accent:'#0369a1', roles:['Captain','Entertainer','Head Chef','Passenger','Bartender','Cruise Director','Deck Hand','Purser'] },
  { name:'Bank',           emoji:'🏦', accent:'#1e3a5f', roles:['Branch Manager','Teller','Security Guard','Loan Officer','Vault Technician','Auditor','Customer','Bank Robber'] },
  { name:'Supermarket',    emoji:'🛒', accent:'#15803d', roles:['Cashier','Stock Clerk','Store Manager','Butcher','Deli Worker','Security Guard','Loyal Customer','Cart Collector'] },
  { name:'Library',        emoji:'📚', accent:'#6d28d9', roles:['Librarian','Student','Researcher','Archivist','Volunteer','Security Guard','Janitor','Professor'] },
  { name:'Pirate Ship',    emoji:'🏴‍☠️', accent:'#92400e', roles:['Captain','First Mate','Cannoneer','Navigator','Cook','Boatswain','Ship Surgeon','Lookout'] },
  { name:'Arctic Station', emoji:'🧊', accent:'#0891b2', roles:['Station Commander','Glaciologist','Meteorologist','Supply Pilot','Engineer','Doctor','Sled Dog Handler','Expedition Guide'] },
  { name:'Haunted House',  emoji:'👻', accent:'#6b21a8', roles:['Ghost','Psychic','Ghost Hunter','Skeptic','Caretaker','Paranormal Investigator','Terrified Tourist','Exorcist'] },
  { name:'Sports Stadium', emoji:'🏟️', accent:'#b91c1c', roles:['Quarterback','Head Coach','Referee','Announcer','Cheerleader','Hot Dog Vendor','Team Doctor','Superfan'] },
];

export function generateAssignments(players) {
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const spyIdx = Math.floor(Math.random() * players.length);
  const roles = [...loc.roles].sort(() => Math.random() - 0.5);
  const firstPlayer = players[Math.floor(Math.random() * players.length)];
  const assignments = {};
  players.forEach((p, i) => {
    assignments[p.id] = {
      isSpy: i === spyIdx,
      role: i === spyIdx ? null : roles[i % roles.length],
      location: i === spyIdx ? null : loc,
    };
  });
  return { location: loc, assignments, firstPlayer };
}

export function getVoteResult(votes, assignments) {
  const counts = {};
  Object.values(votes).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  let maxCount = 0, topId = null;
  Object.entries(counts).forEach(([id, c]) => { if (c > maxCount) { maxCount = c; topId = id; } });
  const spyId = Object.entries(assignments).find(([, a]) => a.isSpy)?.[0];
  return { topId, spyId, caughtSpy: topId === spyId, counts };
}
