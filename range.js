
/**
 *
 * @param {number} start
 * @param {number} end
 * @param {?number} step
 * @return {Range}
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

  class Range {
    constructor(filter = null, map = null, parentRange = null) {
      /**
       * @type {?function(*, number, Range): boolean}
       */
      this._filter = filter

      /**
       * @type {?function(*, number, Range): *}
       */
      this._map = map

      /**
       * @type {?*}
       */
      this._currentValue = start

      /**
       * @type {number}
       */
      this._index = 0

      /**
       * @type {Range}
       */
      this._parentRange = parentRange

      /**
       * @type {{next: function(): *}}
       */
      this._iterator = parentRange || createIterator(this)
    }

    get count() {
      if (!Number.isFinite(end)) {
        return Number.POSITIVE_INFINITY
      }

      if (!this._filter) {
        return this._parentRange ?
            this._parentRange.count :
            Math.floor((end - start) / step)
      }

      // TODO: we have a filter
    }

    next() {
      let value = this._iterator.next()
      let nextIndex
      if (this._index < Number.MAX_SAFE_INTEGER) {
        nextIndex = this._index + 1
      } else {
        nextIndex = Number.POSITIVE_INFINITY
      }

      if (this._filter && !this._filter(value, nextIndex, this)) {
        return this.next()
      }

      this._index = nextIndex
      this._currentValue = this._map ?
          this._map(value, this._index, this) :
          value
      return this._currentValue
    }

    enumerate() {
      return this.map((value, index) => [index, value])
    }

    reverse() {
      if (!Numer.isFinite(end)) {
        throw new Error('Infinite ranges cannot be reversed')
      }

      return range(end, this._currentValue, -step)
    }

    map(mapCallback) {
      return new Range(null, mapCallback, this)
    }

    filter(filterCallback) {
      return new Range(filterCallback, null, this)
    }

    take(count) {
      // TODO
    }

    takeWhile(precondition) {
      // TODO
    }

    fold(initialValue, operation) {
      if (!Number.isFinite(end)) {
        throw new Error(
          'The fold() method cannot be applied to infinite sequences'
        )
      }

      let result = initialValue
      for (let value of this) {
        result = operation(result, value)
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

    clone() {
      let parentClone = this._parentRange ? this._parentRange.clone() : null
      let clone = new Range(this._filter, this._map, parentClone)
      clone._currentValue = this._currentValue
      clone._index = this._index
      if (!this._parentRange) {
        clone._iterator = createIterator(clone)
      }
      return clone
    }

    [Symbol.iterator]() {
      return this
    }
  }

  function createIterator(rangeInstance) {
    return (function * () {
      while (!isEnded()) {
        yield rangeInstance._currentValue

        let currentSafeLimit = Number.POSITIVE_INFINITY - Math.abs(step)
        if (currentSafeLimit > Math.abs(rangeInstance._currentValue)) {
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

  return new Range()
}

if ((typeof module !== 'undefined') && (typeof exports !== 'undefined')) {
  exports.default = range
  exports.range = range
}
