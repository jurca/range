
/**
 * Creates a new sequence of values from the specified starting value
 * (inclusive), to the specified end value (exclusive).
 *
 * The returned object is an iterable object (compatible with the for..of
 * loops), and it is its own iterator.
 *
 * @param {number} start The starting value of the returned sequence. Must be a
 *        safe integer.
 * @param {number} end The ending value of the returned sequence (exclusive).
 *        Must be a safe integer or infinity.
 * @param {?number=} step The step between two consecutive values produced by
 *        the sequence. Must be a safe integer, or {@code null}. When set to
 *        {@code null} or left unspecified, defaults to {@code 1} for
 *        increasing sequences or {@code -1} for decreasing sequences.
 * @return {Range<number>} The created sequence of values.
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
   * A class for representing created sequences.
   *
   * Given its location, repeated calls to the {@linkcode range()} function
   * will produce objects that are not the instances of the same class - this
   * is by design, as the returned value should be simply an iterable/iterator
   * object with extra methods on itself.
   *
   * @template E,P
   */
  class Range {
    /**
     * Initializes the representation of the sequence to return.
     *
     * @param {?function(E, number, Range): boolean} filter The callback used
     *        to filter the values generated by this sequence's internal
     *        iterator.
     * @param {?function(P, number, Range): *} map The callback used to
     *        transform the values generated by this sequence's internal
     *        iterator.
     * @param {?function(E, number, Range): boolean} stop A stopper condition -
     *        a callback that terminates this sequence when it returns
     *        {@code true} for the sequence value passed to it.
     * @param {?Range<P>} parentRange The sequence from which this sequence
     *        should obtain the values before applying its filters,
     *        transformation callbacks and stop tests on those values.
     */
    constructor(filter, map, stop, parentRange) {
      /**
       * The callback used to filter the values generated by this sequence's
       * internal iterator.
       *
       * The first argument will be the potential next value of this sequence
       * to test, the second argument will be the value's index in this
       * sequence should it pass the test, and the last argument will be this
       * sequence itself.
       *
       * @type {?function(E, number, Range): boolean}
       */
      this._filter = filter

      /**
       * The callback used to transform the values generated by this sequence's
       * internal iterator.
       *
       * The first argument will be the value provided by the internal
       * iterator, the second argument will be the value's index in this
       * sequence, and the last argument will be this sequence itself.
       *
       * @type {?function(P, number, Range): E}
       */
      this._map = map

      /**
       * The last value generated by this sequence.
       *
       * @type {E}
       */
      this._currentValue = start

      /**
       * The index of the next value generated by this sequence.
       *
       * @type {number}
       */
      this._index = 0

      /**
       * A stopper condition - a callback that terminates this sequence when it
       * returns {@code true} for the sequence value passed to it.
       *
       * The first argument is the current sequence value candidate, the second
       * argument is the value's index, and the third argument is this sequence
       * itself.
       *
       * @type {?function(E, number, Range): boolean}
       */
      this._stop = stop

      /**
       * The sequence from which this sequence is generating its source values.
       *
       * @type {Range<P>}
       */
      this._parentRange = parentRange

      /**
       * The internal iterator for generating the source values that are used
       * by this sequence to generate its values.
       *
       * @type {{next: function(): {done: boolean, value: *}}}
       */
      this._iterator = parentRange || createIterator(this)

      /**
       * The cached total number of values this sequence can produce.
       *
       * @type {?number}
       */
      this._length = null

      /**
       * The future iteration steps that already have been generated but have
       * not been produced by the sequence yet. These are used when trying to
       * determine the length of a filtered sequence or generate a reversed
       * sequence from a sequence that have modifiers applied to it.
       *
       * @type {[{done: boolean, value: E}, number][]}
       */
      this._preGeneratedValues = []

      /**
       * All of the iteration steps this sequence may produce. This is used
       * only for some of the reversed sequences to ensure the correct behavior
       * of the {@linkcode reset()} method.
       *
       * @type {[{done: boolean, value: E}, number][]}
       */
      this._originalValues = null

      /**
       * The number of values generated so far.
       *
       * @type {number}
       */
      this._generatedValuesCount = 0

      /**
       * A flag signalling whether this sequence has a finite number of values.
       * Set to {@code false} for infinite and possibly infinite sequences.
       *
       * @type {boolean}
       */
      this._isFinite = Number.isFinite(end)
    }

    /**
     * Returns the length of this sequence (the number of values the sequence
     * is able to produce in total).
     *
     * Note that the filtered infinite sequences cannot have their length
     * determined and this property will return {@code Infinity} for them.
     *
     * The property will may return {@code Infinity} for sequences that produce
     * more than {@code Number.MAX_SAFE_INTEGER} values.
     *
     * @return {number} The number of values this sequence is able to produce
     *         in total.
     */
    get length() {
      if (this._length !== null) {
        return this._length
      }

      if (!this._isFinite) {
        let currentRange = this
        let isFilteredRange = !!this._filter
        while (!isFilteredRange && currentRange._parentRange) {
          currentRange = currentRange._parentRange
          isFilteredRange = !!currentRange._filter
        }
        if (isFilteredRange) {
          console.warn(
            'The length of filtered infinite ranges is always assumed to be ' +
            'Infinity, even if that is not the case, because there is no ' +
            'way to reliably determine if an infinitely-generated filtered ' +
            'range would end up having a finite number of elements in a ' +
            'finite time, given the fact that the filter is a callback.'
          )
        }

        this._length = Number.POSITIVE_INFINITY
      } else if (!this._filter && !this._stop) {
        if (this._parentRange) {
          this._length = this._parentRange.length
        } else {
          this._length = Math.floor((end - start) / step) +
              (((end - start) % step) ? 1 : 0)
        }
      } else {
        let nextIteration = getNextValue(this, this._index)
        while (!nextIteration[0].done) {
          this._preGeneratedValues.push(nextIteration)
          nextIteration = getNextValue(this, nextIteration[1])
        }
        let safeLimit = Number.MAX_SAFE_INTEGER - this._generatedValuesCount
        if (this._preGeneratedValues.length <= safeLimit) {
          this._length =
              this._generatedValuesCount + this._preGeneratedValues.length
        } else {
          this._length = Number.POSITIVE_INFINITY
        }
      }

      return this._length
    }

    /**
     * Returns the next iteration step of this sequence.
     *
     * @return {{done: boolean, value: E}} The next iteration step.
     * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols
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
      if (this._generatedValuesCount < Number.MAX_SAFE_INTEGER) {
        this._generatedValuesCount++
      } else {
        this._generatedValuesCount = Number.POSITIVE_INFINITY
      }

      return iteration
    }

    /**
     * Returns a new sequence that will generate a two-tuples (arrays)
     * containing the remaining values from this sequence with their indexes in
     * the returned sequence.
     *
     * The index will be the first element of the returned tuple, the original
     * value will be the second element of the returned tuple.
     *
     * The values of the sequence have 0-based indexes.
     *
     * @return {Range<[number, E]>} A sequence generating the remaining values
     *         and their indexes in tuples.
     */
    enumerate() {
      return this.map((value, index) => [index, value])
    }

    /**
     * Returns a new sequence that will produce the remaining values in this
     * sequence in the reverse order.
     *
     * Infinite sequences cannot be reversed.
     *
     * @return {Range<E>} A sequence that will produce the reamining values in
     *         this sequence in the reverse order.
     * @throws {Error} Thrown if this range is infinite.
     */
    reverse() {
      if (!this._isFinite) {
        throw new Error('Infinite ranges cannot be reversed')
      }

      if (!this._parentRange) {
        let newEnd = this._currentValue
        if (!this._index) {
          newEnd -= step
        }
        return range(end - step, newEnd, -step)
      }

      let values = [...this.clone()]
      let reversedRange = new Range(null, null, null, range(0, 0))
      reversedRange._currentValue = end
      reversedRange._preGeneratedValues = values.reverse().map(
        (value, index) => [{ done: false, value }, index + 1]
      )
      reversedRange._originalValues = reversedRange._preGeneratedValues.slice()
      reversedRange._length = values.length
      return reversedRange
    }

    /**
     * Returns a new sequence that maps the values produced by this sequence
     * using the provided callback to new values.
     *
     * @template R
     * @param {function(E, number, Range): R} mapCallback The callback that
     *        will be used to transform the values of this sequence. This first
     *        argument will be the value, the second will be the index of the
     *        value in the returned sequence, and the last will be the returned
     *        sequence.
     * @return {Range<R>} A sequence that produces the values of this sequence
     *         transformed using the provided callback.
     */
    map(mapCallback) {
      return new Range(null, mapCallback, null, this)
    }

    /**
     * Returns a new sequence that filters the values produced by this sequence
     * using the provided callback.
     *
     * @param {function(E, number, Range): boolean} filterCallback The callback
     *        that will be used to filter the values of this sequence. The
     *        first argument will be the value, the second will be the index of
     *        the value in the returned sequence should it pass the filter, and
     *        the last will be the returned sequence.
     * @return {Range<E>} A sequence that produces the values of this sequence
     *         filtered through thr provided callback.
     */
    filter(filterCallback) {
      return new Range(filterCallback, null, null, this)
    }

    /**
     * Returns a sequence that produces up to the specified number of values
     * from this sequence.
     *
     * The returned sequence will be marked as finite, even if this sequence is
     * infinite.
     *
     * @param {number} count The maximum number of elements the returned
     *        sequence should be able to produce. Must be a safe non-negative
     *        integer.
     * @return {Range<E>} A sequence that will produce only up to the specified
     *         number of elements before terminating.
     */
    take(count) {
      if (!Number.isSafeInteger(count) || (count < 0)) {
        throw new TypeError(
          `The count limit must be a non-negative safe integer, ${count} ` +
          `was provided`
        )
      }

      let limitedRange = this.takeWhile((_, index) => index <= count)
      limitedRange._isFinite = true
      return limitedRange
    }

    /**
     * Returns a sequence that produces values from this sequence while the
     * provided precondition is satisfied.
     *
     * @param {function(E, number, Range): boolean} precondition The
     *        precondition that will be used to test a value to determine
     *        whether to include it in the returned sequence. The first
     *        argument will be the candidate value, the second argument will be
     *        its index in the sequence, and the third will be the returned
     *        sequence itself.
     * @return {Range<E>} A sequence that produces the values from this
     *         sequence while the provided precondition holds true.
     */
    takeWhile(precondition) {
      return new Range(null, null, precondition, this)
    }

    /**
     * Reduces the elements of this sequence using the provided operation into
     * a single value. This method works in the same way as the
     * {@linkcode Array.prototype.reduce} method.
     *
     * The method cannot be used on infinite sequences and will throw an error.
     *
     * @template I
     * @template R
     * @param {I} initialValue The initial value for the first argument of the
     *        provided operation function.
     * @param {function((I|R), E, number, Range): R} operation The operation to
     *        apply on the elements of this sequence in order to produce the
     *        resulting value. The first argument will either be the provided
     *        initial value or a mid-result value, the second argument will be
     *        the currently processed element of the sequence, the third will
     *        be the elements index, and the last argument is this sequence
     *        itself.
     * @return {R} The resulting computed value.
     * @throws {Error} Thrown if called on an infinite sequence.
     */
    reduce(initialValue, operation) {
      if (!this._isFinite) {
        throw new Error(
          'The reduce() method cannot be applied to infinite sequences'
        )
      }

      let result = initialValue
      for (let value of this) {
        result = operation(result, value, this._index, this)
      }
      return result
    }

    /**
     * Resets this sequence to its start, allowing it to generate the same
     * values again.
     */
    reset() {
      if (this._parentRange) {
        this._parentRange.reset()
      } else {
        this._currentValue = start
        this._iterator = createIterator(this)
      }
      this._index = 0
      this._generatedValuesCount = 0;
      if (this._originalValues) {
        this._preGeneratedValues = this._originalValues.slice();
      } else {
        this._preGeneratedValues = [];
      }
    }

    /**
     * Creates a clone of of this sequence. The clone will generate the same
     * values as this sequence from now on. If this sequence has already been
     * used to generate values, these values will not appear in the clone.
     *
     * @return {Range<E>} A clone of this sequence.
     */
    clone() {
      let parentClone = this._parentRange ? this._parentRange.clone() : null
      let clone = new Range(this._filter, this._map, this._stop, parentClone)
      clone._currentValue = this._currentValue
      clone._index = this._index
      if (!this._parentRange && this._index) {
        clone._iterator.next() // shift the iterator after the current value
      }
      clone._length = this._length
      clone._preGeneratedValues = this._preGeneratedValues.slice()
      clone._generatedValuesCount = this._generatedValuesCount
      return clone
    }

    /**
     * Exports the remaining values in this sequence into an array (this
     * sequence will be iterated into its end).
     *
     * Infinite sequences cannot be turned into an array and cause this method
     * to throw an error. This method is therefore a safer way of turning
     * sequences into arrays as compared to {@code [...sequence]}, because
     * using the spread operator (...) on an infinite sequence would enter the
     * code into and infinite operation and effectively freeze the application.
     *
     * @return {E[]} The generated array of values remaining in this sequence.
     * @throws {Error} Thrown if this sequence is infinite.
     */
    toArray() {
      if (!this._isFinite) {
        throw new Error(
          'The infinite sequences cannot be exported to an array'
        )
      }

      return [...this]
    }

    /**
     * Returns the iterator of this {@linkcode Range} instance, which is the
     * instance itself.
     *
     * This method is used to enable compatibility with the for-of cycles.
     *
     * @return {Range<E>} This instance.
     */
    [Symbol.iterator]() {
      return this
    }
  }

  /**
   * Generates the next iteration (the value and a flag whether the end of the
   * sequence has been reached) and the index of the iteration in the sequence
   * of values represented by the provided {@linkcode Range} instance.
   *
   * @template E
   * @param {Range<E>} range The {@linkcode Range} instance representing the
   *        sequence of values for which the next value should be generated.
   * @param {number} currentIndex The index of the previously generated value
   *        in the sequence.
   * @return {[{done: boolean, value: E}, number]} A tuple representing the
   *         next iteration step and the index of the value in the sequence.
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
   * Creates an iterator for generating a sequence of numeric values
   * represented by the provided {@linkcode Range} instance.
   *
   * @param {Range<number>} rangeInstance The {@linkcode Range} instance for
   *        generating a sequence of numbers for which the iterator should be
   *        created.
   * @return {{next: function(): {done: boolean, value: number}}} The created
   *         iterator that will generate the numeric values for the provided
   *         {@linkcode Range} instance.
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
      if (!Number.isFinite(end)) {
        return false
      }

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
