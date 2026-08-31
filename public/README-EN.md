# FrankCards

<div align="center">

<img src="card-icon.svg" width="96" alt="FrankCards" />

### Turn hard-to-start conversations into cards you can open together.

Conversation cards for partners, friends, families, and people who have only just met.

[Use online](https://frank-cards.vercel.app/) · [Download FrankCards v2.1.0](https://github.com/SonghaiFan/frank_cards/releases/tag/v2.1.0) · [All releases](https://github.com/SonghaiFan/frank_cards/releases) · [中文](../README.md) / **English**

</div>

![FrankCards home screen with conversation packs for different moments](../docs/images/readme/home.jpg)

Most of the time, we are not out of things to say. We simply do not know where to begin.

FrankCards turns thoughtful questions into a paced, shared card experience. Pick a pack that fits the moment, place the screen between you, and begin with the first card. There are no correct answers and no score—the conversation that follows is the point.

## v2.1.0: Soft can still be sharp

This release rewrites all 22 built-in packs in English and Chinese around a more direct, honest FrankCards voice. Every question now carries one of two conversational energies: rounded **Bouba** cards invite people to open up; pointed **Kiki** cards cut through politeness and performance. Meaningful conversations need more than safe, agreeable prompts.

Custom Mode now has separate **Official / Community** spaces. Create and keep editing your own pack, then submit it when it is ready. Approved work appears only under Community in Custom Mode. Moderator review keeps the public collection intentional without flattening each creator's voice.

## What makes it different

|  |  |
| --- | --- |
| **A conversation, not a question dump**<br>Each pack has an opening, themes, a card rhythm, and an ending, so the exchange can move naturally from light to meaningful. | **Not limited to one fixed deck**<br>Filter by relationship or mood, or combine several packs into a set that belongs to this particular evening. |
| **Create on the cards, not in a configuration form**<br>Edit the real cover and cards directly—front, back, categories, and color—so what you see is what people will actually use. | **Not a test and not relationship analysis**<br>FrankCards does not score people or draw conclusions. It offers a good question, then gives the attention back to the person in front of you. |

## Make room for a real conversation

- Move beyond repeated small talk when you have only just met.
- Check in with a partner about feelings, hopes, and the small things left unsaid.
- Let a gathering move from funny prompts toward more honest stories.
- Ask family members about memories and experiences that rarely come up.
- Use a question alone as the beginning of reflection or journaling.

## Choose what fits the moment

Built-in packs explore relationships, personal stories, long distance, friendship, family, self-care, imagination, and more. Start with one ready-made pack, or filter and combine several for the people who are actually in the room.

![FrankCards custom mode for filtering and combining conversation packs](../docs/images/readme/custom-mode.jpg)

## The card asks; the space belongs to you

Only one question appears at a time. Color, category, card sides, and progress create a gentle rhythm without competing for attention. Stay with a question, flip it for another layer, or continue whenever the conversation is ready.

<table>
  <tr>
    <td width="50%"><img src="../docs/images/readme/conversation.jpg" alt="FrankCards conversation card" /></td>
    <td width="50%"><img src="../docs/images/readme/topic-studio.jpg" alt="FrankCards direct-on-card topic editor" /></td>
  </tr>
  <tr>
    <td align="center"><sub>A quiet question in the middle, with room for everything else.</sub></td>
    <td align="center"><sub>Create a personal conversation pack on the real cards.</sub></td>
  </tr>
</table>

## Write the questions only you can ask

Some conversations belong to one relationship, one trip, or one particular night. After signing in, create a private pack with its own cover, opening and ending, card backs, categories, and colors. Save it, return to edit it later, or use it immediately.

New packs stay private by default. When you want to share one, submit it for moderator review. Once approved, it appears only in **Community** inside Custom Mode—never mixed into FrankCards' official packs. You can still edit a published pack; changes return it to review.

Built-in packs work without an account, while topics you create stay with your account. v2.1.0 also completes email verification and password recovery, adds clearer spam-folder guidance, and polishes floating mobile progress dots and card transitions.

## Download

The current release includes:

- macOS — Apple Silicon and Intel
- Windows — `.exe` and `.msi`

Download the right installer from the [FrankCards v2.1.0 release](https://github.com/SonghaiFan/frank_cards/releases/tag/v2.1.0).

> The macOS build is not yet notarized by Apple, so macOS may show a security prompt the first time it opens.

<details>
<summary><strong>Want to run the code or contribute?</strong></summary>

### Run locally

With Node.js 20+ and npm installed:

```bash
git clone https://github.com/SonghaiFan/frank_cards.git
cd frank_cards
npm ci
npm run dev
```

The desktop app uses Tauri 2. After installing Rust and the Tauri prerequisites:

```bash
npm run tauri dev
```

Accounts and user-created topics use Supabase. Environment variables, migrations, and email setup are documented in the [Supabase guide](README.md). FrankCards is built with React, TypeScript, Vite, Supabase, and Tauri, and is released under the [MIT License](../LICENSE).

Issues and pull requests are welcome. See the [contribution guide](../CONTRIBUTING_GUIDE.md) before getting started.

</details>

<div align="center">

**Made for conversations that matter.**

</div>
