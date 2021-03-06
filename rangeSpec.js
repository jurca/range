
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

  it('should return the correct length of a numeric sequence', () => {
    expect(range(0, 0).length).toBe(0)
    expect(range(0, 1).length).toBe(1)
    expect(range(0, 10).length).toBe(10)
    expect(range(1, 0).length).toBe(1)
    expect(range(10, 0).length).toBe(10)
    expect(range(5, 15, 3).length).toBe(4)
    expect(range(10, 0, -3).length).toBe(4)
    expect(range(0, 9, 3).length).toBe(3)
    expect(range(0, Infinity).length).toBe(Infinity)
    expect(range(-100, -Infinity).length).toBe(Infinity)
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

  it('should support limiting the sequence length', () => {
    expect([...range(0, Infinity).take(4)]).toEqual([0, 1, 2, 3])
    expect([...range(0, 5).take(0)]).toEqual([])
    expect([...range(0, 3).take(10)]).toEqual([0, 1, 2])
  })

  it('should support limiting the sequence length using a predicate', () => {
    let testingRange = range(0, Infinity).takeWhile((value, index, range) => {
      expect(value).toBeGreaterThan(-1)
      expect(value).toBeLessThan(6)
      expect(index).toBeGreaterThan(0)
      expect(index).toBeLessThan(7)
      expect(range).toBe(testingRange)

      return value < 5
    })
    expect([...testingRange]).toEqual([0, 1, 2, 3, 4])
  })

  it('should support reducing the sequence to a single value', () => {
    let testingRange = range(1, 11)
    expect(testingRange.reduce(5, (a, b) => a + b)).toBe(60)
  })

  it('should support resetting the sequence', () => {
    let testingRange = range(0, 5)
    expect([...testingRange]).toEqual([0, 1, 2, 3, 4])
    expect([...testingRange]).toEqual([])
    testingRange.reset()
    expect([...testingRange]).toEqual([0, 1, 2, 3, 4])

    let anotherRange = range(0, 5).map(n => n * 2)
    expect([...anotherRange]).toEqual([0, 2, 4, 6, 8])
    expect([...testingRange]).toEqual([])
    anotherRange.reset()
    expect([...anotherRange]).toEqual([0, 2, 4, 6, 8])
  })

  it('should support cloning of the sequence', () => {
    let testingRange = range(0, 4)
    expect([...testingRange.clone()]).toEqual([0, 1, 2, 3])
    expect([...testingRange.clone()]).toEqual([0, 1, 2, 3])
    let modifiedRange = testingRange.filter(n => n % 2).map(n => n * 2)
    expect([...modifiedRange.clone()]).toEqual([2, 6])
    expect([...modifiedRange.clone()]).toEqual([2, 6])
    modifiedRange.next()
    expect([...modifiedRange.clone()]).toEqual([6])
    expect([...modifiedRange]).toEqual([6])
    expect([...range(0, 4).take(2).clone()]).toEqual([0, 1])
    expect([...range(0, 4).takeWhile(n => n < 2)]).toEqual([0, 1])
  })

  it('should support reversing the sequence', () => {
    expect([...range(0, 4).reverse()]).toEqual([3, 2, 1, 0])
    expect([...range(0, 4).filter(n => n % 2).reverse()]).toEqual([3, 1])
    let testingRange = range(0, 4)
    testingRange.next()
    expect([...testingRange.clone().reverse()]).toEqual([3, 2, 1])
    testingRange.next()
    expect([...testingRange.reverse()]).toEqual([3, 2])
    expect([...range(0, 4).map(n => n * 2).reverse()]).toEqual([6, 4, 2, 0])
    expect([...range(0, 4).take(2).reverse()]).toEqual([1, 0])
    expect([...range(0, 4).takeWhile(n => n < 2).reverse()]).toEqual([1, 0])
    expect([...range(0, 4).reverse().clone()]).toEqual([3, 2, 1, 0])
  })

  it('should chain the modifiers as applied', () => {
    let testingRange = range(0, 10).filter((value, index) => {
      expect(Number.isSafeInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(-1)
      expect(value).toBeLessThan(10)
      expect(Number.isSafeInteger(index)).toBe(true)
      expect(index).toBeGreaterThan(0)
      expect(index).toBeLessThan(11)

      return value % 2
    }).map((value, index) => {
      expect(Number.isSafeInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(-1)
      expect(value).toBeLessThan(10)
      expect(value % 2).toBe(1)
      expect(Number.isSafeInteger(index)).toBe(true)
      expect(index).toBeGreaterThan(0)
      expect(index).toBeLessThan(6)

      return value * 2
    }).take(4).takeWhile((value, index) => {
      expect(Number.isSafeInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(0)
      expect(value).toBeLessThan(15)
      expect(value % 2).toBe(0)
      expect(Number.isSafeInteger(index)).toBe(true)
      expect(index).toBeGreaterThan(0)
      expect(index).toBeLessThan(5)

      return index < 4
    }).map((value, index) => {
      expect(Number.isSafeInteger(value)).toBe(true)
      expect(value).toBeGreaterThan(0)
      expect(value).toBeLessThan(11)
      expect(Number.isSafeInteger(index)).toBe(true)
      expect(index).toBeGreaterThan(0)
      expect(index).toBeLessThan(4)

      return -value
    })
    let reversedTestingRange = testingRange.clone().reverse()

    let cloned = testingRange.clone()
    expect([...cloned]).toEqual([-2, -6, -10])
    expect(testingRange.length).toBe(3)
    expect([...testingRange]).toEqual([-2, -6, -10])

    cloned = reversedTestingRange.clone()
    expect([...cloned]).toEqual([-10, -6, -2])
    expect(reversedTestingRange.length).toBe(3)
    expect([...reversedTestingRange]).toEqual([-10, -6, -2])
  })

  it('should handle resetting a chain of modifiers', () => {
    let testingRange = range(0, 10).filter(
      n => n % 2
    ).map(
      n => n * 2
    ).take(4).takeWhile((_, i) => i < 3)
    expect(testingRange.next()).toEqual({ done: false, value: 2 })
    testingRange.reset()
    expect(testingRange.next()).toEqual({ done: false, value: 2 })
    expect(testingRange.length).toBe(2)
    testingRange.reset()
    expect([...testingRange]).toEqual([2, 6])

    testingRange.reset()
    let reversed = testingRange.clone().reverse()
    expect(reversed.next()).toEqual({ done: false, value: 6 })
    reversed.reset()
    expect(reversed.next()).toEqual({ done: false, value: 6 })
    reversed.reset()
    expect(reversed.length).toBe(2)
    expect([...reversed]).toEqual([6, 2])
  })

  it('should support reversing the sequence repeatedly', () => {
    let testingRange = range(0, 5)
    expect([...testingRange.reverse().reverse()]).toEqual([0, 1, 2, 3, 4])
    testingRange = testingRange.filter(n => n % 2).map(n => n * 2)
    expect([...testingRange.reverse().reverse()]).toEqual([2, 6])
  })

  it('should be able to provide length of filtered sequences', () => {
    let testingRange = range(0, 10).filter(n => n % 2)
    expect(testingRange.length).toBe(5)
    testingRange = range(0, 10).filter(n => n % 2).map(n => n + 1)
    expect(testingRange.length).toBe(5)
    testingRange = range(0, 10).take(3)
    expect(testingRange.length).toBe(3)
    expect(range(10, 0, -3).filter(n => n % 2).length).toBe(2)
    expect(range(5, Infinity).filter(n => n < 1).length).toBe(Infinity)
  })

  it('should be converted to a finite sequence when take is applied', () => {
    let testingRange = range(0, Infinity)
    expect(testingRange.length).toBe(Infinity)
    expect(testingRange.take(6).length).toBe(6)
    expect(range(0, 4).take(20).length).toBe(4)
  })

})
