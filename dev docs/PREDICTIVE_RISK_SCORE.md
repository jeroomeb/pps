# Nightly risk score

What this is, and how it works. No technical setup is described here.

Each property receives a fresh risk score every afternoon. The score is built from that building’s own completed checklists. It tells the specialist and the property manager which parts of the building deserve attention first tonight.

The checklist itself stays the same. Every item is still answered. The score changes what people see before the shift, which categories appear first, and what the morning report says about the night that just finished.

---

## What the score means

The score is a number from **1 to 100**. A higher number means the building is more likely to have problems tonight.

Life-safety failures raise the score more than appearance issues. An unlatched pool gate or a blocked fire exit counts more than a small trash overflow.

The score is for one property, for one evening. It is ready by **4:00 PM in that property’s own timezone**, so a California building is not scored on an Eastern clock. Tomorrow’s score replaces today’s. The morning report keeps the score that was showing when that night’s visit began, so the prediction and the visit can be compared later.

A building with little or no completed history does not receive a scored warning. The checklist stays in its normal order until enough past visits exist to see a pattern. About 30 days of completed checklists is the point where a score becomes useful. The look-back never goes past 90 days, so an old failure does not dominate a building that has since improved.

---

## What the score is made from

The system reads completed checklists for that property and sorts the questions into risk areas. The areas depend on the checklist type. A luxury condominium, a 55+ community, and a commercial building do not share the same questions, so they do not share the same groups.

The groups are:

- **Life-safety and liability.** Pool gates, fire exits, maintenance-room locks, and anything else that can hurt a person or create a legal exposure.
- **Appearance and city rules.** Trash, dumpster placement, and curb rules.
- **Asset protection.** Valves, leaks, temperature problems, and overflow in rooms such as the parcel room.

Each afternoon the system also looks at the situation for that night:

- The day of the week
- The local weather, especially rain
- Whether the night falls on a holiday weekend
- How often this same property has failed these items before

A pattern tied to the calendar is a normal result. If a building fails its waste checks on Thursday nights because the city pickup is Friday morning, Thursday’s score flags waste for that evening.

---

## What happens at 4:00 PM local time

1. The system reviews the last 30 to 90 days of completed checklists for each property that has history.
2. It weighs life-safety failures more heavily than appearance failures.
3. It adjusts for tonight’s weekday, weather, and holiday weekend.
4. It writes the property’s evening score, from 1 to 100.
5. It names up to **three areas** most likely to fail tonight. If only one area has been failing, only that area is named.
6. Those categories move to the top of that night’s checklist. The remaining categories stay underneath, in their usual order.

The specialist still opens one checklist and still marks every item pass, fail, or N/A. Photos and fail comments stay required exactly as they are today. The flagged categories are simply first.

If a property has more than one checklist type open, each checklist promotes the flagged categories that exist on that checklist. The property still has one evening score.

---

## What the specialist sees

On the assigned property, before the checklist begins, the specialist sees:

- The evening risk score
- The two or three categories flagged for tonight
- A short reason, in plain language, such as “Waste checks fail here on Thursday nights” or “Rain tonight, and leak items have failed here recently”

Inside the checklist, those categories are at the top. The specialist audits them first, then continues through the rest of the list.

The score does not block the visit, and it does not mark any item as failed. Only the specialist’s own answers do that.

---

## What the property manager sees

Before the shift, the manager sees the same evening snapshot for the building: the score, the flagged categories, and the short reason. That snapshot is the pre-shift alert. It is there so the manager knows the night’s focus before the specialist arrives.

After the checklist is submitted, the morning hand-off report adds one section:

- The score that was predicted before the shift
- The categories that were flagged
- What the visit actually found in those categories: passed, failed, or not applicable

A manager can read that section and see whether the predicted trouble was really there. A high score with clean results is a quiet night. A flagged category with failures is the morning problem, documented next to the warning that preceded it.

The rest of the morning report stays as it is: the full checklist, photos, and comments.

---

## A normal day

1. Through the afternoon, specialists finish any open visits. Those results join the history.
2. By 4:00 PM in each property’s timezone, every property with enough history receives a new score and its flagged areas.
3. The specialist opens the assignment, sees the score, and starts with the flagged categories.
4. The manager can see the same pre-shift snapshot.
5. The specialist completes every item and submits.
6. The morning report shows the prediction beside what was found.
7. The next afternoon, the new result is part of the history and the score is calculated again.

---

## Limits

- The score is a warning based on this building’s recent pattern. It is not a guarantee that something will fail, and it is not a substitute for the visit.
- A brand-new property, or a property with only a few completed checklists, has no score yet.
- Questions that were never failed, and questions that do not exist on that checklist type, are not flagged.
- Weather and the holiday calendar affect the score only where they match a pattern already seen in the logs. Rain matters more for leak and asset-protection items than for a gate latch.
- The score refreshes once a day, in the afternoon. It does not change while the specialist is mid-checklist.
- Lead generation and the reply assistant are separate. This score does not send email to prospects, and it does not read the marketing mailbox.
