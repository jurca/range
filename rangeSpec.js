
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
  
})
