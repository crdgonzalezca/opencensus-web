/**
 * Copyright 2019, OpenCensus Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { getInitialLoadSpanContext } from '../src/initial-load-context';
import { WindowWithOcwGlobals } from '../src/types';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

const SPAN_ID_REGEX = /[0-9a-f]{16}/;
const TRACE_ID_REGEX = /[0-9a-f]{32}/;

describe('getInitialLoadSpanContext', () => {
  let realTraceparent: string | undefined;
  let realOcSampleRate: number | undefined;
  beforeEach(() => {
    realTraceparent = windowWithOcwGlobals.traceparent;
    realOcSampleRate = windowWithOcwGlobals.ocSampleRate;
  });
  afterEach(() => {
    windowWithOcwGlobals.traceparent = realTraceparent;
    windowWithOcwGlobals.ocSampleRate = realOcSampleRate;
  });

  it('sets trace and span ID from global `traceparent` when specified', () => {
    windowWithOcwGlobals.traceparent = `00-0af7651916cd43dd8448eb211c80319c-b7ad6b7169203331-00`;
    expect(getInitialLoadSpanContext()).toEqual({
      traceId: '0af7651916cd43dd8448eb211c80319c',
      spanId: 'b7ad6b7169203331',
      options: 0,
    });
  });

  it('generates a new random span context if `traceparent` unspecified', () => {
    windowWithOcwGlobals.traceparent = undefined;
    spyOn(Math, 'random').and.returnValue(0);
    const spanContext = getInitialLoadSpanContext();
    expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
    expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
    expect(spanContext.options).toBe(1);
    expect(Math.random).toHaveBeenCalled();
  });

  it('generates a new random span context if `traceparent` is invalid', () => {
    spyOn(Math, 'random').and.returnValue(0);
    windowWithOcwGlobals.traceparent = 'invalid trace parent header!';
    const spanContext = getInitialLoadSpanContext();
    expect(spanContext.traceId).toMatch(TRACE_ID_REGEX);
    expect(spanContext.spanId).toMatch(SPAN_ID_REGEX);
    expect(spanContext.options).toBe(1);
    expect(Math.random).toHaveBeenCalled();
  });

  describe('specifying the sampling rate with window.ocSampleRate', () => {
    beforeEach(() => {
      spyOn(Math, 'random').and.returnValue(0.5);
      windowWithOcwGlobals.traceparent = undefined;
    });
    it('sets trace options to unsampled if random above sample rate', () => {
      windowWithOcwGlobals.ocSampleRate = 0.1;
      const spanContext = getInitialLoadSpanContext();
      expect(spanContext.options).toBe(0);
    });
    it('sets trace options to sampled if random below sample rate', () => {
      windowWithOcwGlobals.ocSampleRate = 1.0;
      const spanContext = getInitialLoadSpanContext();
      expect(spanContext.options).toBe(1);
    });
  });
});
