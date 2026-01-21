export const BAD_WORDS = [
    "anal", "anus", "arse", "ass", "ballsack", "balls", "bastard", "bitch", "biatch", "bloody",
    "blowjob", "blow job", "bollock", "bollok", "boner", "boob", "bugger", "bum", "butt", "buttplug",
    "clitoris", "cock", "coon", "crap", "cunt", "damn", "dick", "dildo", "dyke", "fag", "feck",
    "fellate", "fellatio", "felching", "fuck", "f u c k", "fudgepacker", "fudge packer", "flange",
    "Goddamn", "God damn", "hell", "homo", "jerk", "jizz", "knobend", "knob end", "labia", "muff",
    "nigger", "nigga", "omg", "penis", "piss", "poop", "prick", "pube", "pussy", "queer", "scrotum",
    "sex", "shit", "s hit", "sh1t", "slut", "smegma", "spunk", "tit", "tosser", "turd", "twat",
    "vagina", "wank", "whore", "wtf"
];

export class ProfanityFilter {
    private words: Set<string>;

    constructor() {
        this.words = new Set(BAD_WORDS);
    }

    isProfane(text: string): boolean {
        const sanitized = text.toLowerCase().replace(/[^a-z\s]/g, '');
        const tokens = sanitized.split(/\s+/);
        return tokens.some(token => this.words.has(token));
    }
}
