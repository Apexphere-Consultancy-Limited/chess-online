# Design Philosophies

These are the fundamental philosophical principles that guide architectural decisions in this codebase. They are abstract, timeless, and independent of specific technologies or implementations.

---

## 1. The Principle of Concern Isolation

**A component should know WHAT it does, not WHO it interacts with.**

When designing a system, ask: "What is the essential nature of this thing?" A chess game enforces rules and displays moves. It does not care whether players are human, computer, or extraterrestrial. The moment you add "who-specific" logic, you violate the component's essence.

**Philosophical question:** If this component were a person with one job, what would that job be?

---

## 2. The Universality Principle

**Seek concepts that apply to all cases, not special cases.**

When you find yourself writing "if bot, do X; if human, do Y," you've likely failed to find the universal abstraction. Step back and ask: "What do both bot and human have in common at a deeper level?"

The moment you create a special case, you're admitting your abstraction is incomplete. Find the universal essence that encompasses all variants.

**Philosophical question:** What is the common essence shared by all variants of this behavior?

---

## 3. The Reality Simulation Principle

**Computers should mimic reality, not the other way around. Bots are digital humans.**

When modeling real-world concepts, let reality guide your design. In chess:
- Humans take time to think → Bots should too
- Humans make moves sequentially → Bots shouldn't move instantly
- Humans can be "thinking" on their turn → So can bots
- Humans have different skill levels → So do bots

Bots aren't a special category requiring different treatment. They're digital humans playing chess. "Thinking time" isn't a bot-specific concept - it's universal to all players. Artificial delays aren't "fake" - they're honest simulation of decision-making time.

The instant computer response is the artificial behavior. Time-delayed responses are truthful.

**Philosophical question:** How would this work in the physical world, and how can we faithfully model that natural behavior?

---

## 4. The Communication-Logic Dichotomy

**Communication is passing messages. Logic is making decisions. Never confuse the two.**

When designing systems, clearly separate:
- **What needs to be decided** (validation, rules, consequences)
- **What needs to be transmitted** (moves, state changes, notifications)

A chess move from a bot is a *message*, not a validated truth. The game must still verify it, just as a referee validates human moves.

**Philosophical question:** Is this component making a decision, or reporting one?

---

## 5. The Single Essence Principle

**Each component should have one clear essence, not multiple personalities.**

If you find yourself saying "This component does X, but also Y, and sometimes Z," you've created a Frankenstein. Components should be like Platonic forms - pure expressions of a single concept.

A game is a game. An opponent is an opponent. A communication layer is a communication layer. Don't merge these essences.

**Philosophical question:** Can I describe this component's purpose in one sentence without using "and" or "also"?

---

## 6. The Interface as Contract Principle

**An interface is a promise about behavior, not implementation.**

When you define an interface, you're stating: "Anything implementing this can be used interchangeably." If you find yourself checking "what type of thing is this" after receiving it through an interface, you've broken the contract.

`GameOpponent` promises: "I can send and receive moves." Whether the opponent uses neural networks, random selection, or quantum mechanics is irrelevant.

**Philosophical question:** Could I replace this implementation with a completely different one without changing any calling code?

---

## 7. The Principle of Natural Boundaries

**Structure follows natural divisions in the problem domain, not technical convenience.**

Don't split code based on files, folders, or frameworks. Split it based on natural conceptual boundaries in the problem itself.

Chess has natural boundaries: the game (rules, state), the players (actors making moves), the board (visual representation). These boundaries exist independent of how you implement them.

**Philosophical question:** If I explained this system to a non-programmer, would these divisions make intuitive sense?

---

## 8. The Least Knowledge Principle

**Components should know as little as possible about the world outside themselves.**

Information is coupling. The more a component knows about external details, the more fragile it becomes. Give each component only the minimum knowledge required for its essence.

A game doesn't need to know about AI algorithms, network protocols, or database schemas. It needs moves in, validation logic, and state updates.

**Philosophical question:** What is the absolute minimum this component needs to know to fulfill its purpose?

---

## 9. The State Ownership Principle

**State belongs to the component that needs to make decisions based on it.**

Don't scatter state across multiple owners. The component that needs to decide based on state should own that state. Others can observe it, but shouldn't control it.

Who needs to know whose turn it is? The component responsible for determining "is the opponent thinking?" That component owns the turn state.

**Philosophical question:** Which component's behavior changes based on this state?

---

## Meta-Principle: The Why Test

When making any design decision, ask:

**"Why is it this way?"**

If the answer is:
- ✅ "Because that's the natural essence of this concept" → Good design
- ✅ "Because it applies universally to all cases" → Good design
- ❌ "Because that's how the library works" → Technical compromise
- ❌ "Because it was easier to code" → Convenience over principle
- ❌ "Because that's how we did it before" → Cargo cult

---

## Applying These Principles

These philosophies are not rules to follow blindly. They are lenses through which to view design problems.

When facing a design decision:
1. **Pause** - Don't immediately code
2. **Abstract** - What is the essence of this problem?
3. **Universalize** - What concept applies to all cases?
4. **Separate** - What are the natural boundaries?
5. **Minimize** - What is the least each component needs to know?
6. **Verify** - Does this feel "right" intuitively?

If a design feels awkward, special-case-heavy, or hard to explain, you've likely violated one of these principles.

---

## The Ultimate Question

When in doubt, ask yourself:

**"If I had to explain this design to someone who has never programmed, would the structure make intuitive sense based on the problem domain alone?"**

If yes, you're likely following good philosophy.
If no, you're likely letting technical details drive design.

---

*Philosophy is not about perfection. It's about having clear principles to guide decisions and recognize when you're making principled trade-offs vs. unprincipled shortcuts.*
