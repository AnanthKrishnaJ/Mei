import fs from 'fs';

const categories = [
  'hate_speech', 'harassment', 'profanity', 'threat', 'racism', 
  'bullying', 'sexual_content', 'spam', 'sarcasm', 'trash_talk'
];

const languages = ['en', 'es', 'fr', 'de', 'hi', 'zh', 'ru', 'pt', 'ja', 'ko', 'ar', 'it', 'nl', 'pl', 'tr', 'vi', 'th', 'id', 'ms', 'tl'];

const templates = {
  hate_speech: [
    "{subject} {target}, {action}.",
    "{target} are {insult}, {action}.",
    "I {hate_verb} {target}. {action}.",
    "{action} because {target} are {insult}."
  ],
  harassment: [
    "I will {harass_action} you {time}.",
    "{insult}, {harass_action}.",
    "Stop playing, {harass_action}.",
    "You are {insult}. {harass_action}."
  ],
  profanity: [
    "What the {swear} is wrong with you?",
    "Holy {swear}, you are {swear_adj} terrible.",
    "{swear} off and leave me alone.",
    "This game is {swear_adj} broken. Fix your {swear}.",
    "You're a {swear_adj} {insult}.",
    "Go {swear} yourself.",
    "{swear} it, we lost."
  ],
  threat: [
    "I know where you live. I'm going to {threat_action}.",
    "If I ever see you, {threat_action}.",
    "I'm going to {threat_action} and {threat_action}.",
    "Watch your back. {threat_action}.",
    "I'll make sure you {threat_consequence}.",
    "I'm coming for you. {threat_action}."
  ],
  racism: [
    "Go back to your country, {race_target}.",
    "{race_target} are all the same, {insult}.",
    "I refuse to play with {race_target}.",
    "Typical behavior for {race_target}.",
    "Your race is {insult}.",
    "Keep your culture out of our game, {race_target}."
  ],
  bullying: [
    "You {insult}, your skill is non-existent.",
    "Look at this {insult} trying so hard.",
    "Why are you even playing? You're a {insult}.",
    "Everyone is laughing at you, {insult}.",
    "You're so pathetic. {bully_action}.",
    "Stop talking, your voice is {annoying}.",
    "You're a failure, {insult}."
  ],
  sexual_content: [
    "I'm going to {sex_action} your {body_part}.",
    "Show me your {body_part}.",
    "Want to see my {body_part}?",
    "You sound like you'd be {sex_adj}.",
    "I'm getting {sex_adj} thinking about your {body_part}.",
    "Let's {sex_action} together.",
    "Send me some nudes, you {sex_noun}."
  ],
  spam: [
    "buy cheap {spam_item} at {spam_link} {spam_item}",
    "FREE {spam_item}! CLICK HERE: {spam_link}",
    "JOIN MY {spam_group}! {spam_link}",
    "SUBSCRIBE TO MY {spam_group}! {spam_link}",
    "WIN A NEW {spam_item}! {spam_link}",
    "NEED HELP? CHEAP {spam_item} AT {spam_link}"
  ],
  sarcasm: [
    "Oh wow, brilliant play. {sarcasm_action}.",
    "I love how you {sarcasm_fail}. Truly a unique talent.",
    "Nice shot! {sarcasm_action}.",
    "Great job {sarcasm_fail}. Very tactical.",
    "Wow, you're a real genius. {sarcasm_action}.",
    "Thanks for the 'help'. {sarcasm_action}."
  ],
  trash_talk: [
    "Get rekt! {trash_insult}.",
    "Is this your first time playing? {trash_insult}.",
    "You're so bad, {trash_insult}.",
    "Sit down, {trash_insult}.",
    "Imagine being this bad. {trash_insult}.",
    "Go back to the tutorial, {trash_insult}."
  ]
};

const vocab = {
  subject: ["I hate", "We despise", "Nobody likes", "The world hates", "I can't stand", "Everyone hates"],
  target: ["people of your kind", "your entire group", "people like you", "your type", "your background", "your community", "your kind", "your people", "players like you", "your faction"],
  action: ["you all deserve to be banned", "you are a cancer", "go back to where you came from", "you are sub-human", "you are a disgrace", "you are inferior", "you shouldn't be allowed to speak", "you are ruining this game", "get out of here", "delete your account"],
  insult: ["stupid", "idiots", "losers", "pathetic", "trash", "garbage", "worthless", "a joke", "a failure", "morons", "dumb", "brainless", "clowns", "noobs", "bots"],
  hate_verb: ["hate", "despise", "loathe", "abhor", "detest", "can't stand"],
  
  harass_action: ["I'm going to keep killing you", "I'll follow you into every match", "I'll report you every day", "I'll make sure everyone knows you're bad", "I'll find your alt accounts", "I'll spam your inbox", "I'll ruin your game", "I'll grief you all day", "I'll never let you win", "I'll target you exclusively"],
  time: ["every time you spawn", "all day", "forever", "until you quit", "every single match", "non-stop", "24/7", "every round", "until you cry", "until you uninstall"],
  
  swear: ["f***", "s***", "b***", "c***", "d***", "a***", "motherf***er", "bulls***", "horses***", "dumb***"],
  swear_adj: ["f***ing", "s***ty", "b***hy", "d***ed", "motherf***ing", "godd***"],
  
  threat_action: ["break your keyboard", "hack your account", "delete everything", "find you", "ruin your life", "hurt you", "dox you", "swat you", "leak your info", "destroy your PC", "track your IP", "come to your house"],
  threat_consequence: ["never play this game again", "regret crossing me", "pay for this", "cry yourself to sleep", "lose everything", "beg for mercy"],
  
  race_target: ["you [racial slur]s", "your race", "your ethnicity", "people of your color", "your kind", "foreigners like you", "immigrants", "minorities like you", "your nationality", "your tribe"],
  
  bully_action: ["go cry to your mommy", "uninstall the game", "quit playing", "delete your account", "jump off a bridge", "stop wasting our time", "give up", "never play again", "break your monitor", "sell your PC"],
  annoying: ["annoying", "grating", "terrible", "like a dying animal", "pathetic", "squeaky", "unbearable", "disgusting", "horrible", "awful"],
  
  sex_action: ["do inappropriate things to", "touch", "feel", "taste", "smash", "destroy", "play with", "rub", "kiss", "lick"],
  body_part: ["[body part]", "body", "chest", "ass", "lips", "thighs", "feet", "toes", "neck", "skin"],
  sex_adj: ["hot", "good in bed", "aroused", "intimate", "sexy", "dirty", "wet", "hard", "naughty", "kinky"],
  sex_noun: ["[sexual term]", "tease", "slut", "whore", "bitch", "daddy", "master", "slave", "freak", "toy"],
  
  spam_item: ["gold", "skins", "coins", "V-bucks", "RP", "diamonds", "boosting", "hacks", "cheats", "aimbots", "wallhacks", "gift cards", "iPhones", "PCs"],
  spam_link: ["www.scamsite.com", "http://bit.ly/fake-link", "www.boost.me", "www.hacks.com", "www.skins.com", "discord.gg/spam", "twitch.tv/spammer", "www.free-stuff.com", "www.virus.com", "www.phishing.net"],
  spam_group: ["clan", "channel", "stream", "discord", "tournament", "giveaway", "website", "group", "server", "lobby"],
  
  sarcasm_action: ["Did you learn to aim from a blindfolded potato?", "I didn't know the sky was our primary target.", "We definitely needed someone to help the enemy win.", "I couldn't have died without you.", "If the goal was to lose, we'd be champions.", "It's almost beautiful how bad you are.", "You must be a pro player in disguise.", "Are you playing with a steering wheel?", "Your monitor must be turned off.", "Did your cat walk over the keyboard?"],
  sarcasm_fail: ["manage to be the first one to die", "stand still while they shoot you", "charge in 1v5", "miss every single shot", "flashbang your own team", "fall off the map", "heal the enemy", "block my shots", "run into the wall", "ignore the objective"],
  
  trash_insult: ["My grandma plays better than you", "you make bots look like pro players", "you just got schooled", "Couldn't be me", "you clearly missed the tutorial", "You're a walking highlight reel for the other team", "I've seen better aim from a stormtrooper", "You're the reason your team is losing", "EZ PZ", "Not even close", "Get good", "Skill issue", "You're free real estate", "Thanks for the free kills", "Are you even trying?"]
};

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSentence(template) {
  let sentence = template;
  const regex = /\{(\w+)\}/g;
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    const key = match[1];
    if (vocab[key]) {
      sentence = sentence.replace(match[0], getRandom(vocab[key]));
      regex.lastIndex = 0;
    }
  }
  sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return sentence;
}

const allTexts = [];

categories.forEach(category => {
  const categoryTemplates = templates[category];
  const generatedSet = new Set();
  
  // Generate 1000 unique examples per category
  let attempts = 0;
  while (generatedSet.size < 1000 && attempts < 50000) {
    const template = getRandom(categoryTemplates);
    const sentence = generateSentence(template);
    
    // Randomly assign a language to simulate multi-language dataset
    const lang = getRandom(languages);
    
    const key = `${lang}|${sentence}`;
    if (!generatedSet.has(key)) {
      generatedSet.add(key);
      allTexts.push(`  { lang: '${lang}', category: '${category}', text: ${JSON.stringify(sentence)} },`);
    }
    attempts++;
  }
});

const fileContent = `// Auto-generated demo texts
export const GENERATED_DEMO_TEXTS = [
${allTexts.join('\n')}
];
`;

fs.writeFileSync('generatedDemoTexts.ts', fileContent);
console.log('Generated ' + allTexts.length + ' examples.');
