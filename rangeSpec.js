
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
    expect([...range(3, 5)]).toEqual([3, 4])
  })

  it('should allow generating a decrementing numeric sequence', () => {
    expect([...range(10, 0)]).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
    expect([...range(5, 3)]).toEqual([5, 4])
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

  it('should return the correct count of a numeric sequence', () => {
    expect(range(0, 0).count).toBe(0)
    expect(range(0, 1).count).toBe(1)
    expect(range(0, 10).count).toBe(10)
    expect(range(1, 0).count).toBe(1)
    expect(range(10, 0).count).toBe(10)
    expect(range(5, 15, 3).count).toBe(4)
    expect(range(10, 0, -3).count).toBe(4)
    expect(range(0, 9, 3).count).toBe(3)
    expect(range(0, Infinity).count).toBe(Infinity)
    expect(range(-100, -Infinity).count).toBe(Infinity)
  })

  it('should support mapping the sequence values', () => {
    let sourceRange = range(0, 5)
    let testingRange = sourceRange.map((value, index, rangeInstance) => {
      expect(rangeInstance).toBe(testingRange)
      return { index: -index, value: value * 2 }
    })
    expect(testingRange).not.toBe(sourceRange)
    expect([...testingRange]).toEqual([
      { index: -1, value: 0 },
      { index: -2, value: 2 },
      { index: -3, value: 4 },
      { index: -4, value: 6 },
      { index: -5, value: 8 }
    ])
    expect(sourceRange.next()).toEqual({
      done: true,
      value: undefined
    })
  })

  it('should support enumerating the sequence values and indexes', () => {
    expect([...range(0, 4).enumerate()]).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3]
    ])
  })

  it('should support filtering the sequence values', () => {
    expect([...range(0, 10).filter(n => !!(n % 2))]).toEqual([1, 3, 5, 7, 9])
  })

  it('should support exporting into an array', () => {
    expect(range(0, 5).toArray()).toEqual([0, 1, 2, 3, 4])
    expect(range(0, 5).enumerate().toArray()).toEqual([
      [1, 0],
      [2, 1],
      [3, 2],
      [4, 3],
      [5, 4]
    ])
    expect(range(0, 5).filter(n => !!(n % 2)).toArray()).toEqual([1, 3])
    expect(range(0, 5).map(n => n * 2).toArray()).toEqual([0, 2, 4, 6, 8])
  })

  it(
    'should throw an error when infinite sequence should be exported into ' +
    'an array',
    () => {
      expect(() => range(0, Infinity).toArray()).toThrow()
    }
  )

})
