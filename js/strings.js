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
      continueDay: 'Continue',
      newDay: 'New day',
      pickApron: 'Tap an apron',
      ready: 'Ready!',
      goals: 'Coin goals',
      right: 'Right',
      notRight: 'Not right',
      bonus: 'Bonus',
      badges: 'Badges',
      ranOutNo: 'Never ran out',
      ranOutYes: 'A bowl ran out',
      next: 'Next',
      inspection: 'Inspection',
      cleanup: 'Clean up',
      dayNo: 'Day {n}',
      savings: 'Savings jar',
    },

    jobs: {
      cashier: 'Cashier',
      manager: 'Manager',
      topping: 'Topping maker',
      tea: 'Tea maker',
      maker: 'Maker',
      front: 'Front counter',
    },

    // One spoken sentence per job. The boss picks the version that matches
    // the call mode (easy, normal or hard); `normal` is used when a mode
    // has no line of its own.
    jobSay: {
      cashier: {
        normal: '{apron} apron, you are the cashier. Listen to each customer, circle their order on a ticket, ring it up, and give the ticket to the manager.',
        hard: '{apron} apron, you are the cashier. Customers only say hello, so look at the pictures, circle the order on a ticket, ring it up, and give the ticket to the manager.',
      },
      manager: {
        normal: '{apron} apron, you are the manager. Hold the ticket, call each step to the makers, check the cup, then ring the bell and serve.',
        easy: '{apron} apron, you are the manager. Put the ticket by the cup, check each drink, then ring the bell and serve.',
      },
      topping: {
        normal: '{apron} apron, you are the topping maker. Keep the toppings ready, and scoop what the manager calls into the cup.',
        easy: '{apron} apron, you are the topping maker. Keep the toppings ready, and scoop what the ticket shows into the cup.',
      },
      tea: {
        normal: '{apron} apron, you are the tea maker. Hold the cup the manager calls, add the tea, then the lid and straw.',
        easy: '{apron} apron, you are the tea maker. Hold the cup the ticket shows, add the tea, then the lid and straw.',
      },
      maker: {
        normal: '{apron} apron, you are the maker. Make the toppings and the tea, just the way the manager calls them.',
        easy: '{apron} apron, you are the maker. Make the toppings and the tea, just the way the ticket shows.',
      },
      front: {
        normal: '{apron} apron, you run the front counter. Take each order on a ticket, ring it up, call the steps to the maker, then check the cup and serve.',
        easy: '{apron} apron, you run the front counter. Take each order on a ticket, ring it up, put the ticket by the cup, then check the cup and serve.',
        hard: '{apron} apron, you run the front counter. Customers only say hello, so look at the pictures. Take each order on a ticket, ring it up, call the steps to the maker, then check the cup and serve.',
      },
    },

    aprons: { pink: 'Pink', blue: 'Blue', yellow: 'Yellow', green: 'Green', orange: 'Orange', purple: 'Purple' },

    checklist: {
      tickets: 'Stack the order tickets.',
      register: 'Try the register.',
      brew: 'Brew the first pot of each tea.',
      rail: 'Set up the ticket rail.',
      batch: 'Make a starting batch of each topping.',
      cups: 'Set out the cups by size.',
      bowls: 'Fill the ice and sugar bowls.',
      lids: 'Stack the lids and straws.',
    },

    // How a spoken order is put together, for example
    // "a large taro with two scoops of fresh boba pearls, some ice and half sugar".
    orderParts: {
      sized: 'a {size} {tea}',
      unsized: '{tea}',
      topping: 'with {topping}',
      toppingScoops: 'with {scoops} of {topping}',
      fresh: 'fresh {topping}',
      brewed: 'freshly brewed {tea}',
      extras: ', {list}',
      and: ' and ',
      comma: ', ',
    },

    menu: {
      tea: { milk: 'milk tea', matcha: 'matcha', taro: 'taro' },
      topping: { pearls: 'boba pearls', jelly: 'coconut jelly', hearts: 'gummy hearts' },
      size: { small: 'small', large: 'large' },
      scoops: { 1: 'one scoop', 2: 'two scoops', 3: 'three scoops' },
      ice: { none: 'no ice', some: 'some ice', lots: 'lots of ice' },
      sugar: { none: 'no sugar', half: 'half sugar', full: 'full sugar' },
      fresh: { yes: 'fresh', no: '' },
      brew: { yes: 'freshly brewed', no: '' },
      base: 'a drink',
    },

    say: {
      bossHello: 'Hello, team! Welcome to the Boba Shop. How many people are playing today?',
      bossAprons: 'Everyone, tap your apron color!',
      bossJobs: 'Here are your jobs for today.',
      bossGoals: 'Today\'s goal: {a} coins for one star, {b} coins for two stars, and {c} coins for three stars!',
      bossBefore: 'Let\'s get the shop ready! Do your list, then tap Ready.',
      hintTea: ['{tea} is today\'s special!', 'I think lots of people will want {tea} today.'],
      hintTopping: ['Everybody loves {topping} today. Make extra!', 'Lots of customers want {topping} today!'],
      allReady: 'Everyone is ready. Let\'s open the shop!',
      bossClosing: 'Great work today! Time to check some drinks.',
      inspectOrder: 'Let\'s check order {n}.',
      inspectAsk: 'Is the cup right?',
      inspectRight: ['Perfect! Here is a bonus coin!', 'Just right! A bonus coin for you!'],
      inspectWrong: ['Oops! Silly drink! That\'s okay.', 'Hee hee, a funny drink! Better luck next time.'],
      noInspection: 'No drinks to check today. That\'s okay!',
      badgeIntro: 'Now for badges!',
      askRanOut: 'Did any topping bowl run empty today?',
      badgePerfectDay: 'Perfect day badge! Every cup was right!',
      badgePerfectRegister: 'Perfect register badge! Every total was right the first time!',
      badgeNeverRanOut: 'Never ran out badge! The toppings never ran out!',
      noBadges: 'No badges today. Let\'s try for one tomorrow!',
      cleanup: 'Clean up time! Black dough in the black tub. White dough in the white tub. Red dough in the red tub. Clean up, clean up, everybody clean up!',
      bye: 'Thank you, team! See you tomorrow!',
      welcomeBack: 'Welcome back! Let\'s keep going.',
      bossPlayers: [
        '{n} players. Great!',
        'A team of {n}! Wonderful!',
      ],
      shopOpen: 'The shop is open!',
      greet: [
        'Hi! I\'m {name}!',
        'Hello there! I\'m {name}.',
        'Hi, Boba Shop! It\'s me, {name}!',
      ],
      // The order sentence. {drink} is built from the parts in `orderParts`.
      order: [
        'Can I please have {drink}?',
        'I would like {drink}, please!',
        '{drink}, please!',
      ],
      wrongTotal: [
        'Hmm, that doesn\'t sound right. Let\'s try again!',
        'Hmm, let\'s count that again.',
      ],
      paid: ['Thank you!', 'Here you go!', 'Yay, thank you!'],
      servedCall: 'Order {n}!',
      sip: ['Yummy!', 'Mmm, delicious!', 'This is perfect!', 'Wow, so good!'],
      tip: ['Here is a tip!', 'Keep the change!'],
      soldOut: 'We used every cup! Sold out! What a great day! Let\'s finish the last drinks.',
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
