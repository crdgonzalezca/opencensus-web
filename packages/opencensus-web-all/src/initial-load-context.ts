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

import { randomSpanId, randomTraceId, SpanContext } from '@opencensus/web-core';
import { traceParentToSpanContext } from '@opencensus/web-propagation-tracecontext';

import { WindowWithOcwGlobals } from './types';

const windowWithOcwGlobals = window as WindowWithOcwGlobals;

/**
 * The default trace sampling rate if no `traceparent` and no `ocSampleRate`
 * are specified on the `window`.
 */
const DEFAULT_SAMPLE_RATE = 0.0001;

/**
 * Gets a span context for the initial page load from the `window.traceparent`,
 * or generates a new random span context if it is missing. For now the new
 * random span context generated if `window.traceparent` is missing is always
 * marked sampled.
 */
export function getInitialLoadSpanContext(): SpanContext {
  if (!windowWithOcwGlobals.traceparent) return randomSampledSpanContext();
  const spanContext = traceParentToSpanContext(
    windowWithOcwGlobals.traceparent
  );
  if (!spanContext) {
    console.log(`Invalid traceparent: ${windowWithOcwGlobals.traceparent}`);
    return randomSampledSpanContext();
  }
  return spanContext;
}

function randomSampledSpanContext() {
  const sampleRate = windowWithOcwGlobals.ocSampleRate || DEFAULT_SAMPLE_RATE;
  return {
    traceId: randomTraceId(),
    spanId: randomSpanId(),
    // Math.random returns a number in the 0-1 range (inclusive of 0 but not 1).
    // That means we should use the strict `<` operator to compare it to the
    // sample rate. A value of 1 for `options` indicates trace sampling.
    options: Math.random() < sampleRate ? 1 : 0,
  };
}
