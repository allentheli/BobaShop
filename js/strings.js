// Every on-screen word and spoken line. To add a language, copy `en`,
// translate it, and add it to STRINGS. `{name}` style slots are filled in
// by say() / t() in js/text.js. A line given as a list is picked at random.

export const STRINGS = {
  en: {
    ui: {
      appName: 'Boba Shop',
      start: 'Start',
      parents: 'Parents (hold)',
      howMany: 'How many players?',
      open: 'Open',
      closed: 'Closed',
      repeat: 'Say it again',
      ringUp: 'Ring it up',
      clear: 'Clear',
      serve: 'Serve',
      cancel: 'Not yet',
      finish: 'Finish',
      done: 'Done',
      orderNo: 'Order {n}',
      coins: '{n} coins',
      dayTotal: 'Day total',
      drinksServed: 'Drinks served',
      fromSales: 'From drinks',
      fromTips: 'From tips',
      stars: 'Stars',
      soundHint: 'Turn the sound up!',
      loading: 'Loading…',
      landscape: 'Turn the iPad sideways',
    },

    menu: {
      tea: { milk: 'milk tea', matcha: 'matcha', taro: 'taro' },
      topping: { pearls: 'boba pearls', jelly: 'coconut jelly', hearts: 'gummy hearts' },
      size: { small: 'small', large: 'large' },
      scoops: { 1: 'one scoop', 2: 'two scoops', 3: 'three scoops' },
      ice: { none: 'no ice', some: 'some ice', lots: 'lots of ice' },
      sugar: { none: 'no sugar', half: 'half sugar', full: 'full sugar' },
      fresh: { yes: 'fresh', no: '' },
      base: 'a drink',
    },

    say: {
      bossHello: 'Hello, team! Welcome to the Boba Shop. How many people are playing today?',
      bossPlayers: [
        '{n} players. Great! Let\'s open the shop!',
        'A team of {n}! Wonderful. Let\'s open the shop!',
      ],
      shopOpen: 'The shop is open!',
      greet: [
        'Hi! I\'m {name}!',
        'Hello there! I\'m {name}.',
        'Hi, Boba Shop! It\'s me, {name}!',
      ],
      // Order sentence for orders with only tea and topping.
      order: [
        'Can I please have {tea} with {topping}?',
        'I would like {tea} with {topping}, please!',
        '{tea} with {topping}, please!',
      ],
      wrongTotal: [
        'Hmm, that doesn\'t sound right. Let\'s try again!',
        'Hmm, let\'s count that again.',
      ],
      paid: ['Thank you!', 'Here you go!', 'Yay, thank you!'],
      servedCall: 'Order {n}!',
      sip: ['Yummy!', 'Mmm, delicious!', 'This is perfect!', 'Wow, so good!'],
      tip: ['Here is a tip!', 'Keep the change!'],
      closing: 'The sun is setting. The shop is closed! Let\'s finish the last drinks.',
      lineBye: ['Bye bye! See you tomorrow!', 'Okay, see you tomorrow!'],
      dayEnd: 'What a day! We made {n} coins!',
      stars1: 'We earned one star!',
      stars2: 'We earned two stars!',
      stars3: 'Three stars! Amazing!',
      noStars: 'Good try, team! Let\'s go for a star next time!',
    },

    customers: {
      mochi: { name: 'Mochi', full: 'Mochi the cat' },
      bao: { name: 'Bao', full: 'Bao the bear' },
      taro: { name: 'Taro', full: 'Taro the dragon' },
    },
  },
};
