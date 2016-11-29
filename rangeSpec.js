
const range = require('./range').default

describe('range', () => {

  it('should return an iterable object that is its own iterator', () => {
    expect(range(0, 1)[Symbol.iterator] instanceof Function).toBe(true)
    let testingRange = range(0, 1)
    expect(testingRange[Symbol.iterator]()).toBe(testingRange)
  })
  
  it('should return an iterator', () => {
    let testingRange = range(0, 1)
    expect(testingRange.next instanceof Function).toBe(true)
    expect(testingRange.next()).toEqual({ done: false, value: 0 })
    expect(testingRange.next()).toEqual({ done: true, value: undefined })
  })

  it('should allow generating an incrementing numeric sequence', () => {
    expect([...range(0, 10)]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('should allow generating a decrementing numeric sequence', () => {
    expect([...range(10, 0)]).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
  })

  it('should allow generating a single-element sequences', () => {
    expect([...range(0, 1)]).toEqual([0])
    expect([...range(7, 8)]).toEqual([7])
  })

  it('should allow generating empty sequences', () => {
    expect([...range(0, 0)]).toEqual([])
    expect([...range(4, 4)]).toEqual([])
  })

  it('should allow specifying the step size of the sequence', () => {
    expect([...range(0, 10, 3)]).toEqual([0, 3, 6, 9])
    expect([...range(0, 9, 3)]).toEqual([0, 3, 6])
    expect([...range(0, 9, -3)]).toEqual([])
    expect([...range(10, 0, -3)]).toEqual([10, 7, 4, 1])
    expect([...range(10, 1, -3)]).toEqual([10, 7, 4])
  })

  it('should allow infinite sequences', () => {
    let testingRange = range(Number.MAX_SAFE_INTEGER - 1, Infinity)
    expect(testingRange.next().value).toBe(Number.MAX_SAFE_INTEGER - 1)
    expect(testingRange.next().value).toBe(Number.MAX_SAFE_INTEGER)
    for (let _ of range(0, 100)) {
      expect(testingRange.next().value).toBe(Infinity)
    }

    testingRange = range(Number.MIN_SAFE_INTEGER + 1, -Infinity)
    expect(testingRange.next().value).toBe(Number.MIN_SAFE_INTEGER + 1)
    expect(testingRange.next().value).toBe(Number.MIN_SAFE_INTEGER)
    for (let _ of range(0, 100)) {
      expect(testingRange.next().value).toBe(-Infinity)
    }
  })

})
