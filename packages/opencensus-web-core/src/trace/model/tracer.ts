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

import * as webTypes from '@opencensus/web-types';
import { NoHeadersPropagation } from '../propagation/no_headers_propagation';
import { AlwaysSampler } from '../sampler/sampler';
import { RootSpan } from './root-span';
import { Span } from './span';

const NO_HEADERS_PROPAGATION = new NoHeadersPropagation();

/** Tracer manages the current root span and trace header propagation. */
export class Tracer implements webTypes.Tracer {
  /** Get and set the currentRootSpan of the tracer. */
  currentRootSpan: RootSpan = new RootSpan(this);

  /**
   * A sampler used to make trace sample decisions. In the case of
   * opencensus-web, ultimate sampling decisions will likely be made by the
   * server or agent/collector. So this defaults to sampling every trace.
   */
  sampler = new AlwaysSampler();

  /** An object to log information to. Logs to the JS console by default. */
  logger: webTypes.Logger = console;

  /** Trace context header propagation behavior. */
  propagation = NO_HEADERS_PROPAGATION;

  /** Event listeners for spans managed by the tracer. */
  eventListeners: webTypes.SpanEventListener[] = [];

  /**
   * Active status from tracer instance - this is always true for
   * opencensus-web for code simplicity purposes.
   */
  active = true;

  /**
   * Trace parameter configuration. Not used by OpenCensus Web, but
   * kept for interface compatibility with @opencensus/web-types.
   */
  readonly activeTraceParams = {};

  /**
   * Starts the tracer. This makes the tracer active and sets `logger` and
   * `propagation` based on the given config. The `samplingRate` property of
   * `config` is currently ignored.
   */
  start(config: webTypes.TracerConfig): Tracer {
    this.logger = config.logger || console;
    this.propagation = config.propagation || NO_HEADERS_PROPAGATION;
    return this;
  }

  /** Stops the tracer. This is a no-op with opencensus-web. */
  stop(): Tracer {
    return this;
  }

  /**
   * Start a new RootSpan to currentRootSpan. Currently opencensus-web only
   * supports a single root span at a time, so this just sets `currentRootSpan`
   * to a new root span based on the given options and invokes the passed
   * function. Currently no sampling decisions are propagated or made here.
   * @param options Options for tracer instance
   * @param fn Callback function
   * @returns The callback return
   */
  startRootSpan<T>(
    options: webTypes.TraceOptions,
    fn: (root: RootSpan) => T
  ): T {
    this.currentRootSpan = new RootSpan(this, options);
    this.currentRootSpan.start();
    return fn(this.currentRootSpan);
  }

  /** Notifies listeners of the span start. */
  onStartSpan(root: webTypes.RootSpan) {
    for (const listener of this.eventListeners) {
      listener.onStartSpan(root);
    }
  }

  /** Notifies listeners of the span end. */
  onEndSpan(root: webTypes.RootSpan) {
    for (const listener of this.eventListeners) {
      listener.onEndSpan(root);
    }
  }

  registerSpanEventListener(listener: webTypes.SpanEventListener) {
    this.eventListeners.push(listener);
  }

  unregisterSpanEventListener(listener: webTypes.SpanEventListener) {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }

  clearCurrentTrace() {
    this.currentRootSpan = new RootSpan(this);
  }

  /**
   * Start a new Span instance to the currentRootSpan
   * @param name Span name
   * @param kind Span kind
   * @returns The new Span instance started
   */
  startChildSpan(name?: string, kind?: webTypes.SpanKind): Span {
    return this.currentRootSpan.startChildSpan(name, kind);
  }

  /**
   * Binds the trace context to the given function - but because opencensus-web
   * currently only supports a single trace context at a time, this just returns
   * the function.
   */
  wrap<T>(fn: webTypes.Func<T>): webTypes.Func<T> {
    return fn;
  }

  /** Binds trace context to NodeJS event emitter. No-op for opencensus-web. */
  wrapEmitter(emitter: webTypes.NodeJsEventEmitter) {}
}
