export const DECKS = [
  {
    id: 'famous',
    name: 'Famous People',
    emoji: '⭐',
    color: 't-yellow',
    bg: 'linear-gradient(160deg,#1a1500,#2e2400)',
    accent: '#ffe600',
    border: 'rgba(255,230,0,0.3)',
    cards: [
      'Taylor Swift','Elon Musk','LeBron James','Beyoncé','Barack Obama',
      'Oprah Winfrey','Tom Hanks','Serena Williams','Steve Jobs','Rihanna',
      'Cristiano Ronaldo','Lady Gaga','Jeff Bezos','Ariana Grande','Dwayne Johnson',
      'Adele','Lionel Messi','Jennifer Lawrence','Drake','Billie Eilish',
      'Cardi B','Zendaya','Bad Bunny','Kim Kardashian','Kanye West',
    ]
  },
  {
    id: 'movies',
    name: 'Movies & TV',
    emoji: '🎬',
    color: 't-pink',
    bg: 'linear-gradient(160deg,#1a0010,#2e0020)',
    accent: '#ff2d78',
    border: 'rgba(255,45,120,0.35)',
    cards: [
      'The Lion King','Titanic','Avatar','Harry Potter','Star Wars',
      'The Office','Friends','Breaking Bad','Stranger Things','Game of Thrones',
      'Spider-Man','Avengers','Frozen','Toy Story','Jurassic Park',
      'The Dark Knight','Inception','Forrest Gump','Home Alone','Shrek',
      'Finding Nemo','The Simpsons','Seinfeld','Grey\'s Anatomy','Squid Game',
    ]
  },
  {
    id: 'animals',
    name: 'Animals',
    emoji: '🦁',
    color: 't-orange',
    bg: 'linear-gradient(160deg,#1a0c00,#2e1800)',
    accent: '#ff7a30',
    border: 'rgba(255,122,48,0.35)',
    cards: [
      'Elephant','Giraffe','Penguin','Polar Bear','Chimpanzee',
      'Shark','Eagle','Chameleon','Kangaroo','Octopus',
      'Hummingbird','Platypus','Komodo Dragon','Narwhal','Axolotl',
      'Peacock','Flamingo','Sloth','Sea Turtle','Gorilla',
      'Toucan','Wolverine','Manta Ray','Snow Leopard','Capybara',
    ]
  },
  {
    id: 'places',
    name: 'Places',
    emoji: '🗺️',
    color: 't-cyan',
    bg: 'linear-gradient(160deg,#001620,#002438)',
    accent: '#00f0ff',
    border: 'rgba(0,240,255,0.3)',
    cards: [
      'Eiffel Tower','Great Wall of China','Statue of Liberty','Mount Everest','Amazon Rainforest',
      'Niagara Falls','Grand Canyon','Colosseum','Machu Picchu','Sahara Desert',
      'Great Barrier Reef','Times Square','Sydney Opera House','Northern Lights','Death Valley',
      'Venice','Easter Island','Stonehenge','Pompeii','Chichen Itza',
      'Antarctica','Monaco','Dubai','Maldives','Yellowstone',
    ]
  },
  {
    id: 'actions',
    name: 'Act it Out',
    emoji: '🎭',
    color: 't-purple',
    bg: 'linear-gradient(160deg,#100018,#1e0030)',
    accent: '#b060ff',
    border: 'rgba(176,96,255,0.35)',
    cards: [
      'Swimming','Surfing','Playing Guitar','Texting','Taking a Selfie',
      'Sneezing','Eating Spaghetti','Riding a Horse','Baking a Cake','Doing Push-ups',
      'Fishing','Painting','Knitting','Playing Tennis','Juggling',
      'Skateboarding','Meditation','Karate','Hula Hoop','Rock Climbing',
      'Sleeping','Brushing Teeth','Tying Shoelaces','Walking a Dog','Reading a Map',
    ]
  },
  {
    id: 'food',
    name: 'Food & Drinks',
    emoji: '🍕',
    color: 't-green',
    bg: 'linear-gradient(160deg,#001808,#002e12)',
    accent: '#00ff88',
    border: 'rgba(0,255,136,0.3)',
    cards: [
      'Pizza','Sushi','Tacos','Ice Cream','Ramen',
      'Chocolate Cake','Pancakes','Lobster','Avocado Toast','Fondue',
      'Paella','Croissant','Dim Sum','Churros','Jerk Chicken',
      'Baklava','Pho','Burritos','Cheesecake','Macarons',
      'Pad Thai','Tiramisu','Fish & Chips','Gelato','Bibimbap',
    ]
  },
];

export class HeadsUpSession {
  constructor(deckId) {
    this.deck = DECKS.find(d => d.id === deckId) || DECKS[0];
    this.cards = [...this.deck.cards].sort(() => Math.random() - 0.5);
    this.index = 0;
    this.got = 0;
    this.skipped = 0;
    this.history = [];
    this.timeLimit = 60;
  }
  current() { return this.cards[this.index] || null; }
  isDone()  { return this.index >= this.cards.length; }
  markGot()  { this.history.push({ word: this.current(), result: 'got' });  this.got++;     this.index++; }
  markSkip() { this.history.push({ word: this.current(), result: 'skip' }); this.skipped++; this.index++; }
}
