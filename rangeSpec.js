
const range = require('./range').default

console.log("testing")

describe('range', () => {

  it('should return an iterable object that is its own iterator', () => {
    expect(range(0, 1)[Symbol.iterator] instanceof Function).toBe(true)
    let testingRange = range(0, 1)
    expect(testingRange[Symbol.iterator]()).toBe(testingRange)
  })
  
  it('should return an iterator', () => {
    expect(range(0, 1).next instanceof Function).toBe(true)
    expect(range(0, 1).next()).toEqual({ done: false, value: 0 })
    expect(range(0, 1).next()).toEqual({ done: true, value: undefined })
  })
  
})
