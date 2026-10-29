# Content

Everything the site says lives in this folder. Edit the markdown, save, and the dev
server hot-reloads. You never need to touch code to change text.

How it works:

- The block between `---` lines at the top of each file is **frontmatter** (YAML).
  It holds short structured fields: titles, stacks, metrics, dates.
- Everything below the frontmatter is the **body**, written in normal markdown.
  It is used for long-form text (stage explanations, project write-ups).
- `draft: true` marks a file whose facts I (Claude) drafted and you must confirm.
  Drafted items show a small amber `DRAFT` tag on the site. Flip it to `false`
  once the numbers and wording are yours.
- Files are ordered by their `order` field, not by filename.
- `engine.md` and every other file here are also the knowledge base for
  "Ask the Engine", so anything you write here is something the chat can answer.

Map:

| File / folder        | Where it shows up                                        |
| -------------------- | -------------------------------------------------------- |
| `site.md`            | Name, title, hero copy, SEO description, social links    |
| `machine/*.md`       | One file per machine stage: the glass panel you get when you click a chamber |
| `chaos/*.md`         | One file per INJECT CHAOS button: detection + healing narration |
| `modules/*.md`       | Project capsules (MODULES) and their detail pages        |
| `instruments.md`     | Skill dials (INSTRUMENT PANEL)                           |
| `flight-log.md`      | Experience timeline (FLIGHT LOG)                         |
| `engine.md`          | Ask the Engine: greeting, suggested questions, extra facts |
| `transmit.md`        | Contact section copy                                     |
