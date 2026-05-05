export const LOCATIONS = [
  { name: 'Casino',        emoji: '🎰' },
  { name: 'Submarine',     emoji: '🤿' },
  { name: 'Space Station', emoji: '🚀' },
  { name: 'Hospital',      emoji: '🏥' },
  { name: 'School',        emoji: '🏫' },
  { name: 'Restaurant',    emoji: '🍽️' },
  { name: 'Airport',       emoji: '✈️' },
  { name: 'Beach',         emoji: '🏖️' },
  { name: 'Military Base', emoji: '🪖' },
  { name: 'Movie Set',     emoji: '🎬' },
  { name: 'Circus',        emoji: '🎪' },
  { name: 'Museum',        emoji: '🏛️' },
  { name: 'Cruise Ship',   emoji: '🚢' },
  { name: 'Bank',          emoji: '🏦' },
  { name: 'Supermarket',   emoji: '🛒' },
  { name: 'Library',       emoji: '📚' },
  { name: 'Pirate Ship',   emoji: '🏴‍☠️' },
  { name: 'Arctic Station',emoji: '🧊' },
  { name: 'Haunted House', emoji: '👻' },
  { name: 'Sports Stadium',emoji: '🏟️' },
];

export const ROLES = [
  'Security Guard','Chef','Tourist','Scientist',
  'Doctor','Janitor','Manager','Entertainer',
  'Reporter','VIP Guest','Technician','Bartender',
  'Pilot','Athlete','Professor','Detective',
];

export function generateAssignments(players) {
  const loc = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  const spyIdx = Math.floor(Math.random() * players.length);
  const roles = [...ROLES].sort(() => Math.random() - 0.5);
  const assignments = {};
  players.forEach((p, i) => {
    assignments[p.id] = {
      isSpy: i === spyIdx,
      role: i === spyIdx ? null : roles[i % roles.length],
      location: i === spyIdx ? null : loc,
    };
  });
  return { location: loc, assignments };
}

export function getVoteResult(votes, assignments) {
  const counts = {};
  Object.values(votes).forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  let maxCount = 0, topId = null;
  Object.entries(counts).forEach(([id, c]) => { if (c > maxCount) { maxCount = c; topId = id; } });
  const spyId = Object.entries(assignments).find(([, a]) => a.isSpy)?.[0];
  return { topId, spyId, caughtSpy: topId === spyId, counts };
}
