
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

  const IDENTITY = _ => _
  const TAUTOLOGY = () => true

  class Range {
    constructor(filter = TAUTOLOGY, map = IDENTITY, parentRange = null) {
      /**
       * @type {function(*, number, Range): boolean}
       */
      this._filter = filter

      /**
       * @type {function(*, number, Range): *}
       */
      this._map = map

      /**
       * @type {number}
       */
      this._currentValue = start

      /**
       * @type {Range}
       */
      this._parentRange = parentRange

      /**
       * @type {number}
       */
      this._index = 0

      let instance = this

      /**
       * @type {{next: function(): number}}
       */
      this._iterator = (function * () {
        while (!isEnded()) {
          yield instance._currentValue

          let currentSafeLimit = Number.POSITIVE_INFINITY - Math.abs(step)
          if (currentSafeLimit > Math.abs(instance._currentValue)) {
            instance._currentValue =
                Math.sign(instance._currentValue) * Infinity
          } else {
            instance._currentValue += step
          }
        }

        function isEnded() {
          return (step > 0) ?
              (instance._currentValue >= end) :
              (instance._currentValue <= end)
        }
      })()
    }

    get count() {
      if (Number.isFinite(end)) {
        if (this._filter === TAUTOLOGY) {
          return Math.floor((end - start) / step)
        }
        // TODO
      } else {
        return Number.POSITIVE_INFINITY
      }
    }

    next() {
      let value = this._iterator.next()
      let nextIndex
      if (this._index < Number.MAX_SAFE_INTEGER) {
        nextIndex = this._index + 1
      } else {
        nextIndex = Number.POSITIVE_INFINITY
      }

      if (!this._filter(value, nextIndex, this)) {
        return this.next()
      }

      this._index = nextIndex
      return this._map(value, this._index, this)
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
      let realMapCallback
      if (this._map === IDENTITY) {
        realMapCallback = mapCallback
      } else {
        realMapCallback = (value, index, instance) => {
          let midValue = this._map(value, index, instance)
          return mapCallback(midValue, index, instance)
        }
      }

      let newRange = new Range(this._filter, realMapCallback)
      newRange._currentValue = this._currentValue
      newRange._index = this._index
      return newRange
    }

    filter(filterCallback) {
      let realFilterCallback
      if (this._filter === TAUTOLOGY) {
        realFilterCallback = filterCallback
      } else {
        realFilterCallback = (value, index, instance) => {
          return this._filter(value, index, instance)
        }
      }
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
      this._currentValue = start
      this._index = 0
    }

    clone() {
      let clone = new Range(this._filter, this._map)
      clone._currentValue = this._currentValue
      clone._index = this._index
      return clone
    }

    [Symbol.iterator]() {
      return this
    }
  }

  return new Range()
}

if ((typeof module !== 'undefined') && (typeof exports !== 'undefined')) {
  exports.default = range
  exports.range = range
}
