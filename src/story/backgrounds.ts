// story/backgrounds.ts — the three starting backgrounds: attributes, trait, kit (CHARACTERS.md). Kit items (crowbar, toolkit) wait for an inventory.
import type { Background } from '../engine/types'
const stats = { hp: 5, reason: 80, rot: 0 }
export const BACKGROUNDS: Readonly<Record<string, Background>> = {
  dockworker: { name: 'Dockworker', attr: { grit: 4, wits: 2, heart: 3 }, trait: 'Hauler', hook: 'You know Pier 9 like your own street.', stats, res: { food: 1, ammo: 0, meds: 0 } },
  mechanic: { name: 'Mechanic', attr: { grit: 3, wits: 4, heart: 2 }, trait: 'Fixer', hook: 'If it has a motor or a lock, you can open it.', stats, res: { food: 0, ammo: 1, meds: 0 } },
  teacher: { name: 'Teacher', attr: { grit: 2, wits: 3, heart: 4 }, trait: 'Silver Tongue', hook: 'People listen when you speak. Kids and elders trust you fast.', stats, res: { food: 0, ammo: 0, meds: 2 } },
}