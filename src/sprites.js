// Pure-code 16-bit RPG Chibi Pixel Art Sprites (像素小人 & Props)

const GIRL_PALETTE = {
  O: '#291b1a', // warm espresso outline
  H: '#2a2232', // dark layered short hair
  h: '#43364f', // hair midtone
  L: '#6b577d', // hair highlight band
  S: '#ffe1c6', // warm fair skin
  s: '#eec09e', // skin shadow
  B: '#f5988e', // rosy cheek blush
  E: '#241618', // dark pupil
  W: '#ffffff', // eye shine / white shirt
  w: '#dfd5c8', // white shirt shadow
  V: '#eb9a52', // warm apricot knit vest
  v: '#c87632', // vest shadow
  Y: '#fad28c', // vest highlight
  K: '#6e4b3e', // pleated brown skirt
  k: '#4f3329', // skirt shadow
  F: '#3d251e', // loafers
  R: '#d95353', // winter red scarf / heart
  r: '#a63535', // scarf shadow
  M: '#9be2fa', // glowing flip phone screen
  m: '#c4cdd6', // silver flip phone body
};

const BOY_PALETTE = {
  O: '#261b19', // warm espresso outline
  H: '#29201c', // dark chestnut hair
  h: '#473730', // hair midtone
  L: '#6e564b', // hair highlight
  S: '#ffdec2', // warm skin
  s: '#edbba0', // skin shadow
  B: '#f09b8e', // blush
  E: '#221618', // pupil
  W: '#ffffff', // eye shine / sneaker trim
  C: '#f5ebd6', // cream inner sweater
  c: '#d9ccb2', // sweater shade
  J: '#385073', // navy jacket
  j: '#253650', // jacket shadow
  l: '#53739e', // jacket lapel highlight
  K: '#8c7258', // khaki trousers
  k: '#6b543e', // trousers shadow
  F: '#3b2c26', // shoes
  R: '#cc5249', // winter scarf
  r: '#993630', // scarf shadow
  M: '#a3ebff', // glowing flip phone screen / silver harmonica shine
  m: '#cbd4de', // silver flip phone / harmonica
};

const CAT_PALETTE = {
  O: '#2e1d18',
  A: '#f09c48',
  a: '#cc7629',
  W: '#fff6e8',
  E: '#291b18',
  P: '#f29ca3',
};

// Build Girl 18x24 chibi sprite dynamically from modular head + body + legs
function getGirlSprite(opts = {}) {
  const pose = opts.pose || 'stand'; // stand, walk, sit_chin, sit_write, sit_train, hold_phone
  const step = (opts.step || 0) & 3;
  const eye = opts.eye || 'open'; // open, blink, happy, side
  const scarf = !!opts.scarf;

  // 18-wide chibi head (Stefanie 2000s refreshing wispy short haircut)
  let eyeRow1 = '.OHHSWESSSSWESHHO.';
  let eyeRow2 = '.OHHSEESSSSSEESHHO'; // wait: keep exact 18 chars!
  eyeRow2 =     '.OHHSEESSSSEESHHO.'; // 1+1+2+1+2+4+2+1+2+1+1 = 18!
  if (eye === 'blink') {
    eyeRow1 = '.OHHSSSSSSSSSSHHO.';
    eyeRow2 = '.OHHSOOSSSSOOSHHO.';
  } else if (eye === 'happy') {
    eyeRow1 = '.OHHSOOSSSSOOSHHO.';
    eyeRow2 = '.OHHOSSOSSOOSSHHO.';
  } else if (eye === 'side') {
    eyeRow1 = '.OHHSSWESSSSWESHO.';
    eyeRow2 = '.OHHSSEESSSSEESHO.';
  }

  const head = [
    '.....OOOOOOOO.....', // 0
    '...OOhhhhhhhhOO...', // 1
    '..OhhLLLLLLLLhhO..', // 2
    '.OhhhLLLLhhhhhhhO.', // 3
    '.OHHhOOhhhHOOhHHO.', // 4
    '.OHHSSSSSSSSSSHHO.', // 5
    eyeRow1,              // 6
    eyeRow2,              // 7
    'OOOHBSSSSSSSSBHOOO', // 8 wispy flipped short hair tips!
    '.OOHsSSSSSSSSsHOO.', // 9
    '..OOHssssssssHOO..', // 10
  ];

  const neckCollar = scarf
    ? [
        '...OORRRRRRRROO...', // 11 cozy scarf
        '..OORRRRRRRRRROO..', // 12
      ]
    : [
        '...OOWWWssWWWOO...', // 11 white shirt collar
        '...OOWWWVVWWWOO...', // 12 apricot knit vest V-neck
      ];

  if (pose === 'sit_chin' || pose === 'sit_write' || pose === 'sit_train') {
    const armRows = pose === 'sit_chin'
      ? [
          '..OOWWVVVVVVSSOO..', // 13 hand raised toward chin
          '..OWwVVYYYYVVsSO..', // 14
          '..OWwVVVVVVVVwWO..', // 15
          '...OOVvVVVVvVOO...', // 16
        ]
      : pose === 'sit_write'
      ? [
          '..OOWWVVVVVVWWOO..', // 13 leaning slightly to write
          '..OWwVVYYYYVVwWOO.', // 14
          '..OWwVVVVVVVVwSSO.', // 15 hand with pencil forward
          '...OOVvVVVVvVOO...', // 16
        ]
      : [
          '..OOWWVVVVVVWWOO..', // 13 train seat
          '..OWwVVYYYYVVwWO..', // 14
          '..OWwVVVVVVVVwWO..', // 15
          '..OOSvvVVVVvvSOO..', // 16
        ];
    const sitLower = [
      '...OOKKKKKKKKOO...', // 17 skirt on chair
      '...OOKKKKKKKKOO...', // 18
      '....OOkkkkkkOO....', // 19
      '.....OOWWWWOO.....', // 20 tucked socks
      '.....OOFFFFOO.....', // 21 loafers
      '.....OOOOOOOO.....', // 22
      '..................', // 23
    ];
    return [...head, ...neckCollar, ...armRows, ...sitLower];
  }

  if (pose === 'hold_phone') {
    const bodyPhone = [
      '..OOWWVVVVVVWWOO..', // 13
      '..OWwVVYYYYVVwWOO.', // 14
      '..OWwVVVVVVVVSSmMO', // 15 holding glowing flip phone!
      '..OOSvvVVVVvvSOOO.', // 16
      '...OOKKKKKKKKOO...', // 17
      '...OOKkKKKKkKOO...', // 18
      '...OOkkkkkkkkOO...', // 19
      '....OOSs..sSOO....', // 20
      '....OOWW..WWOO....', // 21
      '....OOFF..FFOO....', // 22
      '....OOOO..OOOO....', // 23
    ];
    return [...head, ...neckCollar, ...bodyPhone];
  }

  // Standing or 4-frame walking cycle
  let torso = [
    '..OOWWVVVVVVWWOO..', // 13
    '..OWwVVYYYYVVwWO..', // 14
    '..OWwVVVVVVVVwWO..', // 15
    '..OOSvvVVVVvvSOO..', // 16
    '...OOKKKKKKKKOO...', // 17
    '...OOKkKKKKkKOO...', // 18
    '...OOkkkkkkkkOO...', // 19
  ];
  let legs = [
    '....OOSs..sSOO....', // 20
    '....OOWW..WWOO....', // 21
    '....OOFF..FFOO....', // 22
    '....OOOO..OOOO....', // 23
  ];

  if (pose === 'walk') {
    if (step === 1) {
      torso = [
        '..OOWWVVVVVVWWOO..',
        '.OOWwVVYYYYVVwWOO.',
        '.OOSwVVVVVVVVwSOO.',
        '...OOvvVVVVvvOO...',
        '...OOKKKKKKKKOO...',
        '...OOKkKKKKkKOO...',
        '...OOkkkkkkkkOO...',
      ];
      legs = [
        '...OOSs....sSOO...',
        '...OOWW....WWOO...',
        '...OOFF....FFOO...',
        '...OOOO....OOOO...',
      ];
    } else if (step === 3) {
      torso = [
        '..OOWWVVVVVVWWOO..',
        '..OWwVVYYYYVVwWO..',
        '..OSwVVVVVVVVwSO..',
        '...OOvvVVVVvvOO...',
        '...OOKKKKKKKKOO...',
        '...OOKkKKKKkKOO...',
        '...OOkkkkkkkkOO...',
      ];
      legs = [
        '....OOSs.sSOO.....',
        '....OOWW.WWOO.....',
        '....OOFF.FFOO.....',
        '....OOOO.OOOO.....',
      ];
    }
  }

  const rows = [...head, ...neckCollar, ...torso, ...legs];
  // Subtle 1px walk bob on steps 1 & 3
  if (pose === 'walk' && (step === 1 || step === 3)) {
    return ['..................', ...rows.slice(0, 23)];
  }
  return rows;
}

// Build Boy 18x24 chibi sprite dynamically
function getBoySprite(opts = {}) {
  const pose = opts.pose || 'stand'; // stand, walk, umbrella_phone, sit_desk, harmonica
  const step = (opts.step || 0) & 3;
  const eye = opts.eye || 'open';
  const scarf = !!opts.scarf;

  let eyeRow1 = '.OHHSWESSSSWESHHO.';
  let eyeRow2 = '.OHHSEESSSSEESHHO.';
  if (eye === 'blink') {
    eyeRow1 = '.OHHSSSSSSSSSSHHO.';
    eyeRow2 = '.OHHSOOSSSSOOSHHO.';
  } else if (eye === 'happy') {
    eyeRow1 = '.OHHSOOSSSSOOSHHO.';
    eyeRow2 = '.OHHOSSOSSOOSSHHO.';
  }

  const head = [
    '....OOOOOOOOOO....', // 0
    '...OhhhhhhhhhhO...', // 1
    '..OhhLLLLLLhhhhO..', // 2
    '.OhhhhhhhhhhhhhhO.', // 3
    '.OHHhhOOOOhhhHHHO.', // 4 neat parted bangs
    '.OHHSSSSSSSSSSHHO.', // 5
    eyeRow1,              // 6
    eyeRow2,              // 7
    '.OOHBSSSSSSSSBHOO.', // 8
    '..OOHSSSSSSSSHOO..', // 9
    '...OOHssssssHOO...', // 10
  ];

  const neck = scarf
    ? [
        '...OORRRRRRRROO...', // 11
        '..OORRRRRrrrRROO..', // 12
      ]
    : [
        '...OOCCCCCCCCOO...', // 11 cream sweater collar
        '..OOJJCCCCCCJJOO..', // 12 navy jacket shoulders
      ];

  if (pose === 'harmonica') {
    // Holding silver harmonica up to mouth with both hands!
    const harmHead = [...head.slice(0, 9), '..OOHSSmmmmSSHOO..', '..OOSsmMMMMmsSOO..'];
    const harmBody = [
      '..OOJJCCCCCCJJOO..',
      '..OJJlCCCCCCjJOO..',
      '..OJJjCCCCCCjJOO..',
      '...OOjjCCCCjjOO...',
      '...OOjjjjjjjjOO...',
      '...OOKKKKKKKKOO...',
      '...OOKkKKKKkKOO...',
      '....OOKK..KKOO....',
      '....OOKk..kKOO....',
      '....OOWW..WWOO....',
      '....OOFF..FFOO....',
      '....OOOO..OOOO....',
    ];
    return [...harmHead, ...harmBody];
  }

  if (pose === 'sit_desk') {
    const sitBody = [
      '..OOJJlCCCCjJJOO..',
      '..OJJjCCCCCCjJOO..',
      '..OJJjCCCCCCjSSO..',
      '...OOjjCCCCjjOO...',
      '...OOKKKKKKKKOO...',
      '...OOKKKKKKKKOO...',
      '....OOkkkkkkOO....',
      '.....OOKKKKOO.....',
      '.....OOFFFFOO.....',
      '.....OOOOOOOO.....',
      '..................',
    ];
    return [...head, ...neck, ...sitBody];
  }

  if (pose === 'umbrella_phone') {
    const umbBody = [
      '..OOJJlCCCCjJJOO..', // 13
      '..OJJjCCCCCCjJOO..', // 14
      '..OSSjCCCCCCjSmMO.', // 15 left hand umbrella shaft, right hand glowing flip phone!
      '...OOjjCCCCjjOOO..', // 16
      '...OOKKKKKKKKOO...', // 17
      '...OOKkKKKKkKOO...', // 18
      '....OOKK..KKOO....', // 19
      '....OOKk..kKOO....', // 20
      '....OOWW..WWOO....', // 21
      '....OOFF..FFOO....', // 22
      '....OOOO..OOOO....', // 23
    ];
    return [...head, ...neck, ...umbBody];
  }

  let torso = [
    '..OOJJlCCCCjJJOO..', // 13
    '..OJJjCCCCCCjJOO..', // 14
    '..OJJjCCCCCCjJOO..', // 15
    '..OOSjjCCCCjjSOO..', // 16
    '...OOKKKKKKKKOO...', // 17
    '...OOKkKKKKkKOO...', // 18
  ];
  let legs = [
    '....OOKK..KKOO....', // 19
    '....OOKk..kKOO....', // 20
    '....OOWW..WWOO....', // 21
    '....OOFF..FFOO....', // 22
    '....OOOO..OOOO....', // 23
  ];

  if (pose === 'walk') {
    if (step === 1) {
      torso = [
        '..OOJJlCCCCjJJOO..',
        '.OOJJjCCCCCCjJJOO.',
        '.OOSJjCCCCCCjJSOO.',
        '...OOjjCCCCjjOO...',
        '...OOKKKKKKKKOO...',
        '...OOKkKKKKkKOO...',
      ];
      legs = [
        '...OOKK....KKOO...',
        '...OOKk....kKOO...',
        '...OOWW....WWOO...',
        '...OOFF....FFOO...',
        '...OOOO....OOOO...',
      ];
    } else if (step === 3) {
      legs = [
        '....OOKK.KKOO.....',
        '....OOKk.kKOO.....',
        '....OOWW.WWOO.....',
        '....OOFF.FFOO.....',
        '....OOOO.OOOO.....',
      ];
    }
  }

  const rows = [...head, ...neck, ...torso, ...legs];
  if (pose === 'walk' && (step === 1 || step === 3)) {
    return ['..................', ...rows.slice(0, 23)];
  }
  return rows;
}

// Cute Orange Cat Sprite (14x10)
function getCatSprite(sleeping = false, tailFrame = 0) {
  if (sleeping) {
    return [
      '..............',
      '...OO..OO.....',
      '..OAaOOaAO....',
      '.OAAAAAAAAOOO.',
      '.OAOOAAOOAAAaO',
      '.OAPWWWWWaaaaO',
      '..OWWWWWWaaaO.',
      '...OOOOOOOOO..',
    ];
  }
  const tailTop = tailFrame % 2 === 0 ? '..........OO..' : '.........OO...';
  const tailMid = tailFrame % 2 === 0 ? '.........OAaO.' : '........OAaO..';
  return [
    '..OO....OO....',
    '.OAaOOOOaAO...',
    '.OAAAAAAAAO...',
    '.OAEWAAEWAO...',
    '.OAAAPAAAAO...',
     tailTop.slice(0, 9) + 'OAAO.',
    '..OWWWWWWaAaO.',
    '..OWWWWWWaaaO.',
    '..OOWWOOWWOOO.',
    '...OOOOOOOO...',
  ];
}

// RPG Emote Bubble (15x15) floating above pixel characters
const BUBBLE_PALETTE = {
  O: '#36211e',
  W: '#fffaf0',
  s: '#ebd9be',
  R: '#e84a5f',
  r: '#ff8da1',
  B: '#4a8fe7',
  G: '#f2a93b',
  D: '#4a3531',
};

function drawEmoteBubble(canvas, cx, bottomY, type = 'heart', bobOffset = 0) {
  const x = Math.round(cx - 7);
  const y = Math.round(bottomY - 15 + bobOffset);
  const base = [
    '..OOOOOOOOOOO..',
    '.OWWWWWWWWWWWo.',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    'OWWWWWWWWWWWWWs',
    '.OsssssssssssO.',
    '..OOOOOOOOWOO..',
    '........OWO....',
    '........OO.....',
  ].map((r) => r.replace('o', 'O'));

  canvas.drawSprite(x, y, base, BUBBLE_PALETTE);

  const iconX = x + 4;
  const iconY = y + 2;
  if (type === 'heart') {
    const heart = [
      '.RR.RR.',
      'RrRRRRO',
      'RRRRRRO',
      '.RRRRR.',
      '..RRR..',
      '...R...',
    ];
    canvas.drawSprite(iconX, iconY + 1, heart, BUBBLE_PALETTE);
  } else if (type === 'ellipsis') {
    canvas.fillRect(iconX, iconY + 3, 2, 2, '#4a3531');
    canvas.fillRect(iconX + 3, iconY + 3, 2, 2, '#4a3531');
    canvas.fillRect(iconX + 6, iconY + 3, 2, 2, '#4a3531');
  } else if (type === 'music') {
    const note = [
      '..BBBBB',
      '..B...B',
      '..B...B',
      'BBB.BBB',
      'BBB.BBB',
      '.......',
    ];
    canvas.drawSprite(iconX, iconY + 1, note, BUBBLE_PALETTE);
  } else if (type === 'mail') {
    const mail = [
      'GGGGGGG',
      'GOwOwOG',
      'GWWOWWG',
      'GWWWWWG',
      'GGGGGGG',
    ];
    canvas.drawSprite(iconX, iconY + 1, mail, { G: '#d98a3b', O: '#c96a2b', W: '#fffdf7', w: '#f5e1b8' });
  } else if (type === 'exclaim') {
    canvas.fillRect(iconX + 3, iconY, 2, 4, '#e84a5f');
    canvas.fillRect(iconX + 3, iconY + 5, 2, 1, '#e84a5f');
  } else if (type === 'star') {
    const star = [
      '...G...',
      '.GGGGG.',
      '..GGG..',
      '.GG.GG.',
      'G.....G',
    ];
    canvas.drawSprite(iconX, iconY + 1, star, BUBBLE_PALETTE);
  }
}

// Draw Semi-transparent Pixel Umbrella over Boy in rainy scene
function drawPixelUmbrella(canvas, cx, topY) {
  const x = Math.round(cx);
  const y = Math.round(topY);
  // Shaft
  canvas.drawLine(x - 4, y + 3, x - 4, y + 18, '#c8d6e5', 0.85);
  // Dome canopy (translucent icy blue-white with crisp pixel rim!)
  for (let dy = 0; dy <= 7; dy++) {
    const halfW = Math.round(Math.sqrt(Math.max(0, 14 * 14 - (7 - dy) * (7 - dy) * 2.4)));
    canvas.fillRect(x - halfW - 2, y + dy, halfW * 2 + 1, 1, '#d8eefc', 0.36);
    canvas.pset(x - halfW - 2, y + dy, '#ffffff', 0.85);
    canvas.pset(x + halfW - 2, y + dy, '#9ec5e8', 0.85);
  }
  // Scalloped bottom edge & rib highlights
  canvas.fillRect(x - 15, y + 7, 27, 1, '#e8f6ff', 0.85);
  canvas.drawLine(x - 3, y, x - 10, y + 7, '#ffffff', 0.55);
  canvas.drawLine(x - 3, y, x + 5, y + 7, '#ffffff', 0.55);
  canvas.pset(x - 3, y - 1, '#ffffff', 0.9);
}

// Paper airplane sprite (11x7)
const PAPER_PLANE = [
  '........OO.',
  '......OOWWO',
  '...OOOWWWWO',
  'OOOWWWWWWW.',
  '..OOWWssOO.',
  '....OOsO...',
  '.....OO....',
];
const PLANE_PALETTE = {
  O: '#3a2a35',
  W: '#fffdf5',
  s: '#dfd3c3',
};

module.exports = {
  GIRL_PALETTE,
  BOY_PALETTE,
  CAT_PALETTE,
  PAPER_PLANE,
  PLANE_PALETTE,
  getGirlSprite,
  getBoySprite,
  getCatSprite,
  drawEmoteBubble,
  drawPixelUmbrella,
};
