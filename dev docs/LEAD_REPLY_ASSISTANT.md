# Lead reply assistant

What this assistant is, how a reply moves through it, and the limits of the work. No technical setup is described here.

This assistant handles **replies that arrive in the marketing mailbox**. It reads the incoming email, writes a suggested answer from Amenity Op’s outreach rules, and saves that answer as a **draft**. A person reads the draft and sends it by hand.

The assistant does not send email. It does not start the first cold email. It does not run the day-1, day-4, day-8, and day-14 sequence. That outbound sequence stays in the outreach tool, on the marketing domain, separate from `amenityops.app`.

Inspection reports, assignment notices, and password resets stay on `amenityops.app`. This assistant never reads or writes those mailboxes.

---

## What the assistant is for

A lead has already been contacted, or has written in, and a message is now sitting in the marketing inbox. The assistant prepares the next thing a person might send back.

The person remains responsible for the words that actually leave the mailbox. The draft is a suggestion. Sending, editing, and discarding are human decisions.

Two lists stay separate, the same way they do in the outreach plan:

- **Customers.** Property companies that might subscribe.
- **Specialists.** People who might join the field team.

A customer reply gets a customer draft. A specialist reply gets a recruiting draft. The assistant does not move a person from one list to the other.

---

## How one reply moves through the system

1. A message arrives in the marketing mailbox.
2. The assistant decides whether the message needs a draft. Mail that is not a real person writing back is skipped. That includes bounces, out-of-office notices, newsletters, and obvious spam.
3. The assistant reads the new message and the earlier messages in that same thread, so the draft answers what was just asked and does not repeat the first cold email.
4. The assistant classifies the message. The classes are listed below.
5. The assistant writes one reply in Amenity Op’s voice, using only the rules it was given: the product keeps the building’s own staff, the staff follow a digital overnight checklist, and the manager receives a morning report. The offer in a sales reply is the short self-paced demo, after the person has shown they want it.
6. The assistant saves that reply as a draft in the same thread. It does not address a new person, and it does not add anyone to the thread, unless the lead themselves asked the message to be passed to a named colleague. Even then, the draft only suggests that handoff. The human decides whether to use it.
7. The assistant tells the human that a draft is waiting, with the class it chose (for example, “wants the demo” or “asked to stop”).
8. The human opens the draft, checks the facts, edits the wording, and either sends it or deletes it.
9. After the human sends or deletes the draft, the assistant leaves that thread alone until a new message arrives.

If the lead writes again, the cycle starts over. The new draft is based on the message the human actually sent, not on an older unused draft.

---

## What kinds of messages it can draft

| What arrived | What the draft should do |
| --- | --- |
| They want the demo, or they reply “demo” | A short note that includes the demo link and nothing else for sale. |
| They ask how it works | A short explanation of the checklist and the morning report, then an offer of the demo video. |
| They ask about price, contract, or a pilot | A draft that says a person will answer the commercial question. The assistant does not invent a price, a discount, or a contract term. |
| They name a better contact | A draft the human can send to the original sender, thanking them and confirming the handoff. The assistant does not email the new person on its own. |
| They are the wrong person and give no referral | A brief apology and a stop. No pitch. |
| They ask to stop, unsubscribe, or be left alone | A one-line confirmation that outreach has stopped. No demo link. No further draft on later days. |
| They are not interested, without asking to stop | A polite close, in the spirit of email 4. No argument. |
| They are angry or accuse the company of spamming | A short apology and a stop. No pitch. |
| A specialist replies about the role | A recruiting draft about the operations checklist role. It does not describe the job as a security-guard post, and it does not sell the software. |
| They ask a question the training does not answer | A draft that says the human will follow up, and that flags the gap for the human. The assistant does not guess. |

The human can still rewrite any of these. The class is there so the inbox can be sorted, not so the draft is sent untouched.

---

## What it skips

The assistant creates no draft for:

- Bounces and “address not found” notices
- Out-of-office and other automatic replies
- Newsletters, vendor mail, and spam
- Mail that is already a draft the assistant wrote
- A thread where a draft is already waiting and the lead has not written again
- Inspection, billing, or password mail that landed in the wrong box. Those are flagged for the human and are not answered with a sales draft

An out-of-office reply does not count as interest, and it does not cancel a sequence by itself. A human stop request does.

---

## What the human does

The human is the only one who sends.

Before sending, the human checks:

- The draft answers the message that was actually received
- The property name, the person’s name, and the company are correct
- No price, promise, customer name, or result was invented
- A “please stop” message is confirmed and is not given another pitch
- A customer draft and a specialist draft were not mixed
- The demo link, if one is included, is the real link

The human may edit, send, or delete. Sending is a manual action in the mailbox. The assistant does not gain a send button.

If the human deletes a draft and does not send, that is a complete outcome. The assistant does not write a replacement unless a new message arrives.

---

## Possibilities this design allows

- Every marketing reply can have a prepared answer waiting, so the human is editing instead of starting from a blank page.
- The same voice can be used across whoever is covering the inbox that day.
- Interested leads, demo requests, and stop requests can be separated before the human opens the mailbox.
- The cold sequence can be marked to stop as soon as a real person replies, so day-4, day-8, and day-14 emails are not sent over a live conversation. The assistant records that a reply happened. The outreach tool is what actually cancels the remaining scheduled emails. A person confirms the cancellation for a stop request.
- The training text can be updated when the offer changes. New drafts pick up the new rules. Drafts already sitting in the mailbox stay as they were written until a person edits them.
- One marketing domain and a small daily volume work with this design. So does the larger multi-domain plan. The assistant follows the mailbox it is given. It does not decide how many cold emails go out.

---

## Limitations

- **It cannot send.** If nobody opens the drafts, nothing goes out and the lead waits.
- **It can be wrong.** It can misread tone, pick the wrong class, or write a confident sentence that is not true. That is why the draft exists.
- **It only knows what it was given.** It does not know unpublished prices, roadmap dates, legal terms, or which buildings are already customers unless that information is part of its training or the thread.
- **It does not invent proof.** It does not create testimonials, inspection counts, or “a building like yours saved X.” Those lines are omitted.
- **It sees the marketing mailbox only.** It does not read the lead’s other inboxes, LinkedIn, or the inspection app.
- **A long thread can be cut short.** Very long histories may not fit in one reading. The assistant uses the newest messages and the original outreach. The human still has the full thread on screen.
- **Attachments are not a reliable source.** A draft is based on the written message. A spreadsheet, a floor plan, or a screenshot has to be read by the human.
- **Two drafts must not be open on one thread.** If a draft is already waiting, a second one is not created until the lead writes again or the human clears the first draft.
- **The human can reply from a phone and the assistant will not know until it reads the mailbox again.** The next run has to notice that a reply was already sent and must not stack another draft on top.
- **Automatic mail can look like a person.** Vacation notes and ticket-system replies are skipped when they are recognizable. When they are not, the human deletes the draft.
- **Stop requests are a human duty.** The draft can confirm the stop. A person still removes that contact from the outreach tool so no later email is sent.
- **The assistant does not book meetings, take payment, or create a login.** A demo request gets the video link. A call is booked by the human.
- **Mailbox access is limited to the marketing account.** A lost password or a closed mailbox stops the assistant until a person restores access.
- **The words of a lead’s email are sent to the model that writes the draft.** The training rules should say so, and the mailbox should contain sales and recruiting conversation only.

---

## Dos

- Save every suggested answer as a draft in the same thread.
- Tell the human that a draft is waiting, and say which class it is.
- Write in the outreach voice already agreed: existing staff, digital overnight checklist, morning report, demo video when they want it.
- Keep customer replies and specialist replies in separate drafts and separate lists.
- Confirm a stop request in one short draft and mark that contact so the remaining sequence can be cancelled.
- Leave price, legal terms, and promised results for the human to type.
- Skip bounces, out-of-office notes, newsletters, and spam.
- Use the marketing domain mailbox only.
- Let the human edit or delete the draft without the assistant putting it back.

## Don’ts

- Don’t send, schedule, or “send later.”
- Don’t send from `amenityops.app`, and don’t read the report or password mailboxes.
- Don’t start the cold sequence, and don’t write email 1 to someone who has not written in or who is not already in an outreach thread.
- Don’t email a new address the lead did not ask you to contact.
- Don’t keep writing after “unsubscribe,” “remove me,” or “do not contact.”
- Don’t put a job applicant on the sales list, or a property manager on the recruiting list.
- Don’t describe the specialist role as a security-guard job.
- Don’t invent prices, customers, metrics, or features that are not in the training.
- Don’t attach files or put a link in the draft other than the approved demo link, and only on replies that asked for it or clearly want to see the product.
- Don’t open a second draft while one is still waiting.
- Don’t treat an out-of-office note as a yes or as a stop.
- Don’t copy the lead’s confidential details into any mailbox other than the marketing thread they already wrote to.

---

## How this sits next to the rest of the outreach plan

The outreach plan finds buildings and candidates, then sends the first sequence from warmed-up marketing inboxes. This assistant starts when a person writes back.

The outbound tool owns first contact and the timed follow-ups. This assistant owns the suggested answer to a live reply. The human owns the decision to send.

Nothing in this document is built yet. It describes the behavior to build when that work starts.
