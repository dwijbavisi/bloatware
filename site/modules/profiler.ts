import log, { Logger } from './logger';

/**
 * Profiler for tracking execution time of build events.
 * 
 * @example
 * import { Profiler } from 'modules/profiler';
 * const profiler = new Profiler();
 * 
 * profiler.time('build');
 * // ... do work ...
 * profiler.timeEnd('build', 'Total build time');
 */
class Profiler {
    /**
     * Internal map to store start times for labeled timers.
     */
    private _timers: Map<string, number> = new Map();
    
    /**
     * Logger instance used to emit profiling metrics.
     */
    private _logger: Logger;

    /**
     * Create a new profiler instance.
     * 
     * @param logger - Optional logger instance. Defaults to the shared logger.
     */
    constructor(logger: Logger = log) {
        this._logger = logger;
    }

    /**
     * Start a timer with a given label.
     * 
     * @param label - Unique identifier for the timer.
     * @example
     * import profiler from 'modules/profiler';
     * profiler.time('parse-markdown');
     */
    public time(label: string): void {
        this._timers.set(label, performance.now());
    }

    /**
     * Stop a timer, log the elapsed time, and return the duration.
     * 
     * @param label - Unique identifier for the timer.
     * @param message - Optional message to prefix the logged duration.
     * @returns The elapsed duration in milliseconds, or undefined if the timer wasn't found.
     * @example
     * import profiler from 'modules/profiler';
     * 
     * profiler.time('parse-markdown');
     * // ... parsing logic ...
     * const duration = profiler.timeEnd('parse-markdown', 'Parsed in');
     */
    public timeEnd(label: string, message: string = 'Elapsed time'): number | undefined {
        const start = this._timers.get(label);
        
        if (start === undefined) {
            this._logger.warn(`Profiler: Timer '${label}' does not exist.`);
            return undefined;
        }
        
        const duration = performance.now() - start;
        this._timers.delete(label);
        
        this._logger.info(`${message}: ${duration.toFixed(2)}ms`);
        return duration;
    }
}

/**
 * Shared default profiler instance for application-wide use.
 * 
 * @example
 * import profiler from 'modules/profiler';
 * 
 * profiler.time('render');
 * // ... render logic ...
 * profiler.timeEnd('render', 'Rendered page in');
 */
const profiler = new Profiler();

export {
    Profiler,
}

export default profiler;
