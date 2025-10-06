/* deck.js — SDSU Edition (data only)
   This file defines the deck, config, and text for both modes.
   Step 4 will import this and plug it into the game engine.
*/
window.DECK = {
  meta: {
    name: "SDSU Edition",
    version: 1,
    author: "You",
  },
  config: {
    winPoints: 10,                // first to this wins (can be changed in Step 4 UI)
    roundSeconds: 90,             // round duration
    bellIntervalSeconds: 180,     // Hepner Bell interrupt
    crowdMax: 10,                 // when reached: trigger Storm the Court
    crowdReset: 3,                // reset to this after Storm
  },
  // Mapping guidelines for actions (not parsed yet—purely informational for Step 4)
  actionLegend: {
    // Party → Sober suggested swaps
    "sip1": { party: "Take 1 sip", sober: "+1 point or 1 water sip" },
    "sip2": { party: "Take 2 sips", sober: "+2 points or 2 water sips" },
    "chug3": { party: "3-count drink", sober: "15s wall-sit or +3 points" },
    "cheers": { party: "Cheers someone", sober: "Give +1 point to someone" },
  },

  cards: [
    /* ---------------------- Hepner Bell ---------------------- */
    {
      id: "HB-01",
      category: "Hepner Bell",
      type: "event",
      title: "Chime Time",
      text: "The bell tolls! Everyone reacts.",
      actions: {
        sober: "ALL: +1 point or 1 water sip. Raise Crowd +1.",
        party: "ALL: Take 1 sip. Raise Crowd +1.",
      },
      crowdDelta: +1,
      tags: ["global","timer"]
    },
    {
      id: "HB-02",
      category: "Hepner Bell",
      type: "event",
      title: "Echo on the Quad",
      text: "Last person to clap twice does the action.",
      actions: {
        sober: "Last clapper: +1 push-up or give +1 point to someone else.",
        party: "Last clapper: take 1 sip or give 1 sip.",
      },
      tags: ["reflex"]
    },
    {
      id: "HB-03",
      category: "Hepner Bell",
      type: "event",
      title: "Study Break",
      text: "Everyone stretch and hydrate.",
      actions: {
        sober: "ALL: 2 deep breaths, 1 water sip. Crowd +1.",
        party: "ALL: Quick cheers (no drinking required). Crowd +1.",
      },
      crowdDelta: +1,
      tags: ["wellness"]
    },
    {
      id: "HB-04",
      category: "Hepner Bell",
      type: "event",
      title: "Roll Call",
      text: "Caller names any building; others thumbs up if they’ve had a class there.",
      actions: {
        sober: "Those who haven’t: +1 point to someone who has.",
        party: "Those who haven’t: take a tiny sip or pass a sip.",
      },
      tags: ["campus"]
    },

    /* ---------------------- Trolley Tokens ---------------------- */
    {
      id: "TR-01",
      category: "Trolley Tokens",
      type: "utility",
      title: "Transfer Pass",
      text: "Keep this card. You may skip any one challenge later.",
      actions: {
        sober: "Bank this as a Skip. (Non-stackable with other Skips.)",
        party: "Bank this as a Skip. (Non-stackable with other Skips.)",
      },
      token: "skip",
      tags: ["keep"]
    },
    {
      id: "TR-02",
      category: "Trolley Tokens",
      type: "utility",
      title: "Express Line",
      text: "Your next success is worth extra.",
      actions: {
        sober: "Next success: +2 bonus points.",
        party: "Next success: you may give 2 sips.",
      },
      token: "boost",
      tags: ["keep"]
    },
    {
      id: "TR-03",
      category: "Trolley Tokens",
      type: "utility",
      title: "Missed Stop",
      text: "You zoned out and missed your stop.",
      actions: {
        sober: "-1 point OR do 5 squats.",
        party: "Take 1 sip OR give 1 sip.",
      },
      tags: ["penalty"]
    },
    {
      id: "TR-04",
      category: "Trolley Tokens",
      type: "utility",
      title: "Fare Inspector",
      text: "Anyone holding no token does the action.",
      actions: {
        sober: "Those with no token: +1 water sip or -1 point.",
        party: "Those with no token: 1 sip.",
      },
      tags: ["group"]
    },

    /* ---------------------- The Show ---------------------- */
    {
      id: "TS-01",
      category: "The Show",
      type: "call",
      title: "I Believe",
      text: "Lead the classic: “I believe that we will win!”",
      actions: {
        sober: "If the chant syncs, Crowd +2. If off-beat, caller -1 point (fun penalty).",
        party: "If the chant syncs, Crowd +2. If off-beat, caller takes 1 sip.",
      },
      crowdDelta: +2,
      tags: ["chant"]
    },
    {
      id: "TS-02",
      category: "The Show",
      type: "call",
      title: "Defense Clap",
      text: "Everyone clap a 4-beat pattern in unison.",
      actions: {
        sober: "If all on-beat: everyone +1. Else, off-beaters do 3 jumping jacks.",
        party: "If all on-beat: everyone gives 1 sip. Else, off-beaters take 1 sip.",
      },
      tags: ["rhythm"]
    },
    {
      id: "TS-03",
      category: "The Show",
      type: "call",
      title: "Wave Runner",
      text: "Start a stadium wave around the circle.",
      actions: {
        sober: "If it completes one loop, Crowd +1.",
        party: "If it completes one loop, Crowd +1.",
      },
      crowdDelta: +1,
      tags: ["group"]
    },
    {
      id: "TS-04",
      category: "The Show",
      type: "call",
      title: "Free Throw Distraction",
      text: "Pick a ‘shooter’. Others silently attempt to distract with faces only.",
      actions: {
        sober: "Shooter guesses a number 1–3. If matched by majority, -1 point; else +1.",
        party: "Shooter flips a coin. Heads: give 2 sips. Tails: take 1 sip.",
      },
      tags: ["social"]
    },

    /* ---------------------- Kawhi Bounce ---------------------- */
    {
      id: "KB-01",
      category: "Kawhi Bounce",
      type: "skill",
      title: "The Bounce",
      text: "Virtual coin flip (we’ll simulate in Step 4).",
      actions: {
        sober: "Heads: +2 points. Tails: +1 water sip.",
        party: "Heads: give 2 sips. Tails: take 1 sip.",
      },
      tags: ["skill","coin"]
    },
    {
      id: "KB-02",
      category: "Kawhi Bounce",
      type: "skill",
      title: "Behind the Back",
      text: "Call your shot before the flip.",
      actions: {
        sober: "If you called it: +3 points. Else: -1 point (or 10s plank).",
        party: "If you called it: give 3 sips. Else: take 1 sip.",
      },
      tags: ["risk"]
    },
    {
      id: "KB-03",
      category: "Kawhi Bounce",
      type: "skill",
      title: "Bank Shot",
      text: "Team-up: your left and right teammates both guess.",
      actions: {
        sober: "If at least one guess is right: you +2. Else: each does 1 water sip.",
        party: "If at least one guess is right: you give 2 sips. Else: each takes 1 sip.",
      },
      tags: ["team"]
    },
    {
      id: "KB-04",
      category: "Kawhi Bounce",
      type: "skill",
      title: "Clutch",
      text: "You may reflip once, but must keep the second result.",
      actions: {
        sober: "Second flip doubles points gained/lost this card (min -1, max +4).",
        party: "Second flip doubles sips given/taken this card (min 1, max 4).",
      },
      tags: ["push-your-luck"]
    },

    /* ---------------------- Viejas Arena ---------------------- */
    {
      id: "VA-01",
      category: "Viejas Arena",
      type: "arena",
      title: "Home Court",
      text: "Choose Home vs Away sides (left/right of caller).",
      actions: {
        sober: "Home: each +1. Away: each do 1 water sip. Crowd +1.",
        party: "Home: each give 1 sip. Away: each take 1 sip. Crowd +1.",
      },
      crowdDelta: +1,
      tags: ["sides"]
    },
    {
      id: "VA-02",
      category: "Viejas Arena",
      type: "arena",
      title: "Timeout",
      text: "Short reset.",
      actions: {
        sober: "ALL: 10s stretch + hydrate. Caller +1 point.",
        party: "ALL: quick water sip. Caller gives 1 sip.",
      },
      tags: ["wellness"]
    },
    {
      id: "VA-03",
      category: "Viejas Arena",
      type: "arena",
      title: "Buzzer Beater",
      text: "Caller counts down 10…0. Someone must say “Splash!” at 3.",
      actions: {
        sober: "If someone nails it: caller +2. If none: caller -1.",
        party: "If someone nails it: caller gives 2 sips. If none: caller takes 1 sip.",
      },
      tags: ["timing"]
    },
    {
      id: "VA-04",
      category: "Viejas Arena",
      type: "arena",
      title: "Storm the Court",
      text: "Triggers when Crowd Meter reaches max.",
      actions: {
        sober: "ALL: +1 point. Reset Crowd to 3.",
        party: "ALL: give 1 sip to anyone. Reset Crowd to 3.",
      },
      triggersOnCrowdFull: true,
      tags: ["crowd"]
    },

    /* ---------------------- Aztec History ---------------------- */
    {
      id: "AH-01",
      category: "Aztec History",
      type: "trivia",
      title: "Landmarks",
      text: "Name any two SDSU-related landmarks or locations (campus or SD area).",
      actions: {
        sober: "Correct: +2 points. Otherwise: do a fun mini-dare (compliment someone).",
        party: "Correct: give 2 sips. Otherwise: take 1 sip.",
      },
      tags: ["trivia"]
    },
    {
      id: "AH-02",
      category: "Aztec History",
      type: "trivia",
      title: "Notable Names",
      text: "Name one notable SDSU-associated person (athlete, alum, faculty).",
      actions: {
        sober: "If group accepts: +2. If contested: +1 only.",
        party: "If group accepts: give 2 sips. If contested: give 1 sip.",
      },
      tags: ["trivia","social"]
    },
    {
      id: "AH-03",
      category: "Aztec History",
      type: "trivia",
      title: "Red & Black",
      text: "Find something red or black in the room within 5 seconds.",
      actions: {
        sober: "Success: +1. Fail: -1 or 1 water sip.",
        party: "Success: give 1 sip. Fail: take 1 sip.",
      },
      tags: ["search"]
    },
    {
      id: "AH-04",
      category: "Aztec History",
      type: "trivia",
      title: "Departments",
      text: "Name three engineering disciplines or courses you’ve taken/know.",
      actions: {
        sober: "3+: +2 points. 2: +1. <2: 10s wall-sit.",
        party: "3+: give 2 sips. 2: give 1. <2: take 1.",
      },
      tags: ["academic"]
    },

    /* ---------------------- Sunset Cliffs ---------------------- */
    {
      id: "SC-01",
      category: "Sunset Cliffs",
      type: "risk",
      title: "Double or Nothing",
      text: "Flip a coin. Call it before the flip.",
      actions: {
        sober: "Win: +2. Lose: -1 (or 10s plank).",
        party: "Win: give 2 sips. Lose: take 1 sip.",
      },
      tags: ["risk","coin"]
    },
    {
      id: "SC-02",
      category: "Sunset Cliffs",
      type: "risk",
      title: "Tide Check",
      text: "Choose Safe Shore or Risky Cliff.",
      actions: {
        sober: "Safe: +1 now. Risky: 50/50 for +3 or -1.",
        party: "Safe: give 1 sip. Risky: flip for give 3 sips or take 1.",
      },
      tags: ["choice"]
    },
    {
      id: "SC-03",
      category: "Sunset Cliffs",
      type: "risk",
      title: "Seagull Steal",
      text: "Trade with someone.",
      actions: {
        sober: "Steal 1 point from someone (can’t go below 0).",
        party: "Make someone take 1 sip AND you give them a compliment.",
      },
      tags: ["trade","social"]
    },
    {
      id: "SC-04",
      category: "Sunset Cliffs",
      type: "risk",
      title: "Golden Hour",
      text: "Share a wholesome/funny campus story in 20s.",
      actions: {
        sober: "Story landed (group vote): +2. Otherwise: +1 water sip.",
        party: "Story landed (group vote): give 2 sips. Otherwise: take 1 sip.",
      },
      tags: ["story","vote"]
    },
  ],
};
