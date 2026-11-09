import type { FileDoc } from "./types";

export const FILES: Record<string, FileDoc> = {
  perimeter: {
    title: "Perimeter is a movie set",
    dept: "DUTY LOG / GATE",
    body: `Tell the tourists the lights are runway tests. If they ask about the hole, there is no hole.

Night crew badge M-17 clocked in eleven minutes before the siren. The badge log shows the same clock-in yesterday, and tomorrow. Facilities does not get tomorrow yet.

Your pager, when you found it on the bench, already said DESCEND.`,
  },
  silvertip: {
    title: "Silver-tip",
    dept: "MILITARY POLICE / YARD",
    body: `The motor pool was briefed on trespassers. Riot loads. Then someone swapped the cans for silver-tip and did not update the speech.

They were not told the targets dislike photographs, or that some of the targets still have employee numbers. Hold the yard. Do not look down the hatch. The hatch is a drainage feature.`,
  },
  index: {
    title: "Index of transfers",
    dept: "ARCHIVE / STACKS",
    body: `Projects moved below on the same night in 1979, in 1996, and again last Tuesday: BLUEBOOK residue, LEGERDEMAIN, VEIL, SERAPH, CHOIR.

The dates are not a pattern the archivists are allowed to name. Upper stacks are keyed to a gait you do not have yet. Your badge number is already on a locker in the servo lab.

If a file cites you as present, do not correct it.`,
  },
  roster: {
    title: "Redacted roster",
    dept: "ARCHIVE / MEZZANINE",
    body: `Maintenance roster, sublevel 1. Nineteen names. Eighteen black bars. The last line is a badge number, M-17, hired the year you remember and also the year your mother was born.

Margin note, different hand: "Do not issue the keycard until the calves take." The keycard was already in the tray.`,
  },
  legerdemain: {
    title: "Project LEGERDEMAIN",
    dept: "SERVO LAB",
    body: `Mobility grafts, tested on facilities staff because they already go where the scientists will not. Ankles, then calves, then the part of the reflex that decides to jump a second time.

The boots in locker M-17 are scuffed on the inside. Someone has been breaking them in. The wear matches your stride. You have not put them on yet.

You have put them on before.`,
  },
  intake: {
    title: "Seraph intake",
    dept: "RECORDS CAGE",
    body: `A chapel's worth of gold leaf arrived under a farming subsidy. The crate manifest says RELIQUARY. The engineering rider says CAPACITOR.

Senators will fund a voice if you call it faith. They will bury a voice if you call it a weapon. This office does both, and files the contradiction under weather.`,
  },
  menagerie: {
    title: "Menagerie",
    dept: "BIO VAULT",
    body: `They are not wildlife. Labels still on the tanks: MOTH, DOVER, FLATWOOD, FRESNO. Failed attempts to give the chapel something with knees.

Three cylinders have been reclassified as EMPLOYEE. The violet glass between you and the lower shaft is Project VEIL. It does not open for hands. It opens for the moment you are briefly not entirely here.`,
  },
  capacitor: {
    title: "The ark is a capacitor",
    dept: "ANNEX",
    body: `Wood would have been cheaper. Gold holds a charge and photographs well.

The ark does not speak. It stores a speaking. What the lower ring calls the Choir is the red pen on a document this base pretends is geology. Do not finish a sentence you hear in the glass.`,
  },
  forgetting: {
    title: "The disc did not crash",
    dept: "CRADLE BAY",
    body: `It was built in this room. Then the builders forgot. Then a later crew found it, called it foreign, and requested a larger budget to reverse-engineer their own welds.

Forgetting is the deliverable. The shaft under the cradle is unpowered until a cell from this bay is seated. Below the disc, the document starts to show revisions.`,
  },
  minutes: {
    title: "Minutes of the Choir",
    dept: "THE WELL",
    body: `The deepest project is not a weapon. It is an edit. Reality is a document with too many authors, and the Choir is what happens when the margin notes learn to fly.

Your pager's last message is timestamped tomorrow: YOU ALREADY WENT DOWN. BRING YOURSELF BACK.

If you are reading this, you are the copy that continued. The other one is badging in at the gate.`,
  },
  "scrap-film": {
    title: "Contact sheet, fence",
    dept: "UNFILED / WALL",
    body: `Twelve frames of the wire. In frame nine a man in your vest is already on the inside of the fence, walking toward the gate you have not opened yet.

The camera time is eleven minutes ago. The siren on the film has not started.`,
  },
  "scrap-lint": {
    title: "Lint from the return",
    dept: "UNFILED / DUCT",
    body: `Facilities pulled a filter and logged what would not burn: silver hair, a page of a roster, and a badge clip stamped M-17.

The clip is warmer than the duct. They put the filter back.`,
  },
  "scrap-vial": {
    title: "Vial 19",
    dept: "UNFILED / MENAGERIE",
    body: `Label scraped off with a thumbnail. The glass remembers a hand. Contents listed, then crossed out: blood, then ink, then "whatever the page is bleeding."

Do not drink it. The last tech who did began speaking in tomorrow's tense.`,
  },
  "scrap-shift": {
    title: "Shift change under the disc",
    dept: "UNFILED / CRADLE",
    body: `The crew that built the saucer clocked out through a door that is not on the plate. Their badges still ping from inside the hull.

One ping is yours. It started before you took the service lift.`,
  },
};

export const FILE_ORDER = [
  "perimeter",
  "silvertip",
  "index",
  "roster",
  "legerdemain",
  "intake",
  "menagerie",
  "capacitor",
  "forgetting",
  "minutes",
  "scrap-film",
  "scrap-lint",
  "scrap-vial",
  "scrap-shift",
];
