# ChatGPT Image Generation Workflow

This document is for future ChatGPT threads.

## 1. Main rule

Always treat the approved Createosaur T. rex as the **style anchor** and **pipeline anchor**.

That means:
- match its illustration family
- match its profile-based presentation
- match its realism/stylization balance
- match its rig-friendly discipline

Use the T. rex references as:
- style reference
- quality threshold
- process model

Do **not** use the T. rex as a direct anatomy template for all species.

---

## 2. Required staged workflow

### Step A — Make the master
Prompt for a single clean approved master illustration.

Output should be:
- one species
- one pose
- full body
- side/profile
- plain background
- no text
- no diagram junk

### Step B — Review the master
Before moving on, ask:

- Does it feel like the approved T. rex family?
- Does the head read as credible?
- Is the species identity clear?
- Is the pose stable and riggable?
- Is the mouth neutral?
- Is the eye restrained?

If not, fix the master **before** layer work.

### Step C — Extract layers
Only after the master is approved:
- preserve exact visible design
- separate into canonical body layers
- maintain full-canvas alignment

### Step D — Add hidden overlap
Extend concealed pixels beneath adjoining parts.

### Step E — Make pattern masks
Generate:
- solid
- mottle
- bands

### Step F — Make trait pack if requested
Generate only the requested attachment family:
- horns
- frills
- plates
- sail
- crest
- feathers
- spikes
- club
- etc.

---

## 3. What to avoid

Do not ask the image model to make:
- technical posters
- huge diagram sheets with lots of labels
- tiny annotation text
- giant “all-in-one pipeline” boards
- overly dramatic scene art
- final implementation docs disguised as images

---

## 4. Future-thread kickoff structure

In a new thread, do this:

1. provide the T. rex style references
2. name the target species
3. name the archetype/body plan
4. request only the **master illustration** first
5. review it
6. then request extraction
7. then request masks
8. then request trait pack if needed

---

## 5. Review questions after every image step

### For a master illustration
- does the head look serious and animal-like?
- does the silhouette read well?
- does it feel like Createosaur?
- is it too cartoonish?
- is it too photoreal?
- are proportions species-appropriate?

### For a layer pack
- does reassembly match the approved master?
- do the pieces feel plausible for a 2D rig?
- are overlaps likely to support modest motion?
- did the model accidentally redesign the dinosaur?

### For pattern masks
- are they clipped to the exact layers?
- would they move with the parts?
- are the patterns biologically plausible?
- are they free of extra visual clutter?

---

## 6. Output expectation by stage

### Master stage
Beautiful, stable, clean, single assembled dinosaur.

### Layer stage
Controlled decomposition, not new illustration direction.

### Pattern stage
Functional grayscale masks, not decorative posters.

### Trait stage
Only attachment pieces or attachment-focused previews.

---

## 7. Tone for future ChatGPT threads

The ideal instruction tone is:

- precise
- staged
- conservative
- quality-focused
- suspicious of fake text
- explicit about what should *not* change

Think:
> “Preserve the approved visible design and decompose it carefully.”

That wording tends to protect the pipeline better than:
> “Make it cooler” or “make it more detailed”.
