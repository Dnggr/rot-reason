// tests/ui/keys.test.ts — shortcuts: 1-4 pick (enabled choices only), Space skips then continues, J is the Journal; never inside fields, with a modifier, or on key repeat
import { describe, expect, it } from 'vitest'
import { keyCommand, type KeyCtx, type KeyInput } from '../../src/ui/keys'
const key = (k: string, over: Partial<KeyInput> = {}): KeyInput => ({ key: k, target: 'BODY', mod: false, repeat: false, ...over })
const choices: KeyCtx = { kind: 'choices', choices: [{ enabled: true }, { enabled: false }, { enabled: true }], typing: false }
const narration: KeyCtx = { kind: 'next', choices: [], typing: false }
describe('number keys', () => {
  it('pick the choice at that position', () => {
    expect(keyCommand(key('1'), choices)).toEqual({ kind: 'pick', index: 0 })
    expect(keyCommand(key('3'), choices)).toEqual({ kind: 'pick', index: 2 })
  })
  it('ignore a locked choice, a missing choice, 0, 5 and a narration scene', () => {
    expect(keyCommand(key('2'), choices)).toBeUndefined()
    expect(keyCommand(key('4'), choices)).toBeUndefined()
    expect(keyCommand(key('0'), choices)).toBeUndefined()
    expect(keyCommand(key('5'), choices)).toBeUndefined()
    expect(keyCommand(key('1'), narration)).toBeUndefined()
  })
  it('work while a button has focus (digits do not press buttons)', () => {
    expect(keyCommand(key('1', { target: 'BUTTON' }), choices)).toEqual({ kind: 'pick', index: 0 })
  })
})
describe('Space', () => {
  it('skips the typing first, then continues a narration scene, and does nothing on a choice scene', () => {
    expect(keyCommand(key(' '), { ...narration, typing: true })).toEqual({ kind: 'skip' })
    expect(keyCommand(key(' '), narration)).toEqual({ kind: 'next' })
    expect(keyCommand(key(' '), choices)).toBeUndefined()
    expect(keyCommand(key(' '), { ...choices, typing: true })).toEqual({ kind: 'skip' })
  })
  it('leaves a focused button, link or summary to press itself', () => {
    for (const target of ['BUTTON', 'A', 'SUMMARY']) expect(keyCommand(key(' ', { target }), narration)).toBeUndefined()
  })
})
describe('J and the guards', () => {
  it('J and j open the Journal (M3)', () => {
    expect(keyCommand(key('j'), narration)).toEqual({ kind: 'journal' })
    expect(keyCommand(key('J'), choices)).toEqual({ kind: 'journal' })
  })
  it('nothing fires inside a text field, with ctrl / meta / alt, or when the key is held', () => {
    for (const target of ['INPUT', 'TEXTAREA', 'SELECT']) {
      expect(keyCommand(key('1', { target }), choices)).toBeUndefined()
      expect(keyCommand(key(' ', { target }), narration)).toBeUndefined()
      expect(keyCommand(key('j', { target }), narration)).toBeUndefined()
    }
    expect(keyCommand(key('1', { mod: true }), choices)).toBeUndefined()
    expect(keyCommand(key(' ', { repeat: true }), narration)).toBeUndefined()
  })
  it('other keys are ignored', () => {
    for (const k of ['Enter', 'a', 'Escape', 'ArrowDown']) expect(keyCommand(key(k), choices)).toBeUndefined()
  })
})