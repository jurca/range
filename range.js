
/**
 *
 * @param {number} start
 * @param {number} end
 * @param {?number} step
 * @return {Range<number>}
 */
function range(start, end, step = null) {
  if (!Number.isSafeInteger(start)) {
    throw new TypeError(
      `The starting value must be a safe integer, ${start} was provided`
    )
  }
  if ((typeof end !== 'number') || (Math.floor(end) !== end)) {
    throw new TypeError(
      `The ending value must be an integer or infinity, ${end} was provided`
    )
  }
  if (
    Number.isFinite(end) &&
    ((end < Number.MIN_SAFE_INTEGER) || (end > Number.MAX_SAFE_INTEGER))
  ) {
    throw new RangeError(
      `The ending value must be within the [Number.MIN_SAFE_INTEGER, ` +
      `Number.MAX_SAFE_INTEGER] range or infinite, ${end} was provided`
    )
  }

  if (step === null) {
    step = end >= start ? 1 : -1
  } else {
    if (!Number.isSafeInteger(step)) {
      throw new TypeError(
        `The step must be either a null or a safe integer, ${step} was ` +
        `provided`
      )
    }
    if (!step) {
      throw new RangeError(
        `The step cannot be 0`
      )
    }
  }

  /**
   * @template E
   */
  class Range {
    /**
     * @template P
     * @param {?function(E, number, Range): boolean} filter
     * @param {?function(P, number, Range): *} map
     * @param {?function(E, number, Range): boolean} stop
     * @param {?Range<P>} parentRange
     */
    constructor(filter, map, stop, parentRange) {
      /**
       * @type {?function(E, number, Range): boolean}
       */
      this._filter = filter

      /**
       * @type {?function(*, number, Range): E}
       */
      this._map = map

      /**
       * @type {E}
       */
      this._currentValue = start

      /**
       * @type {number}
       */
      this._index = 0

      /**
       * @type {?function(E, number, Range): boolean}
       */
      this._stop = stop

      /**
       * @type {Range}
       */
      this._parentRange = parentRange

      /**
       * @type {{next: function(): {done: boolean, value: *}}}
       */
      this._iterator = parentRange || createIterator(this)

      /**
       * @type {?number}
       */
      this._count = null

      /**
       * @type {[{done: boolean, value: E}, number][]}
       */
      this._preGeneratedValues = []

      /**
       * @type {number}
       */
      this._generatedValuesCount = 0
    }

    /**
     * @return {number}
     */
    get count() {
      if (this._count !== null) {
        return this._count
      }

      if (!Number.isFinite(end)) {
        let currentRange = this
        let isFilteredRange = !!this._filter
        while (!isFilteredRange && currentRange._parentRange) {
          currentRange = currentRange._parentRange
          isFilteredRange = !!currentRange._filter
        }
        if (isFilteredRange) {
          console.warn(
            'The count of filtered infinite ranges is always assumed to be ' +
            'Infinity, even if that is not the case, because there is no ' +
            'way to reliably determine if an infinitely-generated filtered ' +
            'range would end up having a finite number of elements in a ' +
            'finite time, given the fact that the filter is a callback.'
          )
        }

        this._count = Number.POSITIVE_INFINITY
      } else if (!this._filter) {
        this._count = this._parentRange ?
            this._parentRange.count :
            Math.floor((end - start) / step)
      } else {
        let nextIteration = getNextValue(this, this._index)
        while (!nextIteration[0].done) {
          this._preGeneratedValues.push(nextIteration)
          nextIteration = getNextValue(this, nextIteration[1])
        }
        this._count =
            this._generatedValuesCount + this._preGeneratedValues.length
      }

      return this._count
    }

    /**
     * @return {{done: boolean, value: E}}
     */
    next() {
      let iteration, nextIndex
      if (this._preGeneratedValues.length) {
        [iteration, nextIndex] = this._preGeneratedValues.shift()
      } else {
        [iteration, nextIndex] = getNextValue(this, this._index)
      }

      this._index = nextIndex
      this._currentValue = iteration.value
      this._generatedValuesCount++

      return iteration
    }

    /**
     * @return {Range<[number, E]>}
     */
    enumerate() {
      return this.map((value, index) => [index, value])
    }

    /**
     * @return {Range<E>}
     * @throws {Error} Thrown if this range is infinite.
     */
    reverse() {
      if (!Number.isFinite(end)) {
        throw new Error('Infinite ranges cannot be reversed')
      }

      if (!this._parentRange) {
        return range(end, this._currentValue, -step)
      }

      let values = [...this.clone()]
      let reversedRange = new Range(null, null, null, null)
      reversedRange._currentValue = end
      reversedRange._iterator = {
        next() {
          return {
            done: true,
            value: undefined
          }
        }
      }
      reversedRange._preGeneratedValues = values.map((value, index) => [
        {
          done: false,
          value
        },
        index
      ])
      reversedRange._count = values.length
      return reversedRange
    }

    /**
     * @template R
     * @param {function(E, number, Range): R} mapCallback
     * @return {Range<R>}
     */
    map(mapCallback) {
      return new Range(null, mapCallback, null, this)
    }

    /**
     * @param {function(E, number, Range): boolean} filterCallback
     * @return {Range<E>}
     */
    filter(filterCallback) {
      return new Range(filterCallback, null, null, this)
    }

    /**
     * @param {number} count
     * @return {Range<E>}
     */
    take(count) {
      return this.takeWhile((_, index) => index < count)
    }

    /**
     * @param {function(E, number, Range): boolean} precondition
     * @return {Range<E>}
     */
    takeWhile(precondition) {
      return new Range(null, null, precondition, this)
    }

    /**
     * @template I
     * @template R
     * @param {I} initialValue
     * @param {function((I|R), E, number, Range): R} operation
     * @return {R}
     */
    reduce(initialValue, operation) {
      if (!Number.isFinite(end)) {
        throw new Error(
          'The fold() method cannot be applied to infinite sequences'
        )
      }

      let result = initialValue
      for (let value of this) {
        result = operation(result, value, this._index, this)
      }
      return result
    }

    reset() {
      if (this._parentRange) {
        this._parentRange.reset()
      } else {
        this._currentValue = null
        this._iterator = createIterator(this)
      }
      this._index = 0
    }

    /**
     * @return {Range<E>}
     */
    clone() {
      let parentClone = this._parentRange ? this._parentRange.clone() : null
      let clone = new Range(this._filter, this._map, this._stop, parentClone)
      clone._currentValue = this._currentValue
      clone._index = this._index
      if (!this._parentRange) {
        clone._iterator = createIterator(clone)
      }
      clone._count = this._count
      clone._preGeneratedValues = this._preGeneratedValues.slice()
      clone._generatedValuesCount = this._generatedValuesCount
      return clone
    }

    /**
     * @return {E[]}
     */
    toArray() {
      return [...this]
    }

    /**
     * @return {Range<E>}
     */
    [Symbol.iterator]() {
      return this
    }
  }

  /**
   * @template E
   * @param {Range<E>} range
   * @param {number} currentIndex
   * @return {[{done: boolean, value: E}, number]}
   */
  function getNextValue(range, currentIndex) {
    let iteration = range._iterator.next()
    let nextIndex
    if (currentIndex < Number.MAX_SAFE_INTEGER) {
      nextIndex = currentIndex + 1
    } else {
      nextIndex = Number.POSITIVE_INFINITY
    }

    if (iteration.done) {
      return [iteration, nextIndex]
    }

    if (range._filter && !range._filter(iteration.value, nextIndex, range)) {
      return getNextValue(range, currentIndex)
    }

    if (range._map) {
      iteration.value = range._map(iteration.value, nextIndex, range)
    }

    if (range._stop && !range._stop(iteration.value, nextIndex, range)) {
      return [{done: true, value: undefined}, nextIndex]
    }

    return [iteration, nextIndex]
  }

  /**
   * @param {Range<number>} rangeInstance
   * @return {{next: function(): {done: boolean, value: number}}}
   */
  function createIterator(rangeInstance) {
    return (function * () {
      while (!isEnded()) {
        yield rangeInstance._currentValue

        let currentSafeLimit = Number.MAX_SAFE_INTEGER - Math.abs(step)
        if (currentSafeLimit < Math.abs(rangeInstance._currentValue)) {
          rangeInstance._currentValue =
              Math.sign(rangeInstance._currentValue) * Infinity
        } else {
          rangeInstance._currentValue += step
        }
      }
    })()

    function isEnded() {
      return (step > 0) ?
          (rangeInstance._currentValue >= end) :
          (rangeInstance._currentValue <= end)
    }
  }

  return new Range(null, null, null, null)
}

if ((typeof module !== 'undefined') && (typeof exports !== 'undefined')) {
  exports.default = range
  exports.range = range
}
