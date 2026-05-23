// Static lookup initialization
const _safeDebug = (console.debug ?? console.log).bind(console);
const _safeInfo = console.log.bind(console);
const _safeWarn = (console.warn ?? console.log).bind(console);
const _safeError = (console.error ?? console.log).bind(console);

/**
 * Supported named log levels for the Logger.
 *
 * - debug: Logs everthing; use in debug mode.
 * - info: Logs information, warning and error messages.
 * - warn: Logs only warning and error messages.
 * - error: Logs only error messages.
 * - silent: Suppress all logs; use in production mode for interal modules.
 */
const enum LogLevel {
    /**
     * Debug log level. Logs everything; use in debug mode.
     */
    debug = 'debug',

    /**
     * Info log level. Logs information, warning and error messages.
     */
    info = 'info',

    /**
     * Warn log level. Logs only warning and error messages.
     */
    warn = 'warn',

    /**
     * Error log level. Logs only error messages.
     */
    error = 'error',

    /**
     * Silent log level. Suppress all logs; use in production mode for interal
     * modules.
     */
    silent = 'silent',
}

/**
 * Configuration options for the logger instance.
 */
interface LoggerOptions {
    /**
     * Named log level threshold.
     */
    level?: LogLevel
}

/**
 * Logger class for logging messages to the native console.
 *
 * @param namespace - Optional namespace to prefix each log message.
 * @param options - Optional configuration options for the logger instance.
 */
class Logger {
    /**
     * Namespace to prefix each log message.
     */
    protected _namespace?: string

    /**
     * Configuration options for the logger instance.
     */
    protected _options: LoggerOptions & { level: LogLevel } = {
        level: LogLevel.info
    }

    /**
     * Create a new logger instance.
     *
     * @param namespace - Optional namespace to prefix each log message.
     * @param options - Optional configuration options for the logger instance.
     */
    constructor(namespace?: string, options?: LoggerOptions) {
        if (namespace)
            this._namespace = String(namespace);
        this._options = { ...this._options, ...(options ?? {}) };
    }

    /**
     * Get the current configuration options used by logger.
     *
     * @returns The current configuration options used by logger.
     */
    public get options(): LoggerOptions {
        return { ...this._options }
    }

    /**
     * Update the current configuration options used by logger.
     *
     * @param options - Configuration options to be updated.
     */
    public set options(options: LoggerOptions) {
        this._options = { ...this._options, ...(options ?? {}) };
    }

    /**
     * Determine whether a message should be emitted at the requested level.
     *
     * @param level - Named log level to check against the current threshold.
     * @returns `true` when the message should be output, otherwise `false`.
     */
    protected _levelEnabled(level: LogLevel): boolean {
        switch (this._options.level) {
            case LogLevel.debug:
                return true
            case LogLevel.info:
                switch (level) {
                    case LogLevel.debug:
                        return false
                    default:
                        return true
                }
            case LogLevel.warn:
                switch (level) {
                    case LogLevel.debug:
                    case LogLevel.info:
                        return false
                    default:
                        return true
                }
            case LogLevel.error:
                switch (level) {
                    case LogLevel.debug:
                    case LogLevel.info:
                    case LogLevel.warn:
                        return false
                    default:
                        return true
                }
            case LogLevel.silent: // Define for optimized lookup in production
            default:
                return false
        } // switch (this._options.level)
    }

    /**
     * Build the canonical log line for output.
     *
     * @param level - Log level string.
     * @param message - Main message text.
     * @returns The formatted log string with timestamp and optional namespace.
     */
    protected _formatMessage(level: string, message: string): string {
        const timestamp = new Date().toISOString(); // YYYY-MM-DDThh:mm:ss.lllZ
        const ns = this._namespace ? `[${this._namespace}] ` : '';
        return `${timestamp} ${level} ${ns}${message}`
    }

    /**
     * Internal log helper that routes to the appropriate console method.
     *
     * @param level - Named log level for the message.
     * @param message - Message text to emit.
     * @param meta - Additional metadata to include in the console output.
     */
    protected _log(level: LogLevel, message: string, ...meta: any[]) {
        switch (level) {
            case LogLevel.debug:
                _safeDebug(message, ...meta);
                break
            case LogLevel.info:
                _safeInfo(message, ...meta);
                break
            case LogLevel.warn:
                _safeWarn(message, ...meta);
                break
            case LogLevel.error:
                _safeError(message, ...meta);
                break
            default:
                _safeInfo(message, ...meta);
        } // switch (level)
    }

    /**
     * Log a debug-level message.
     *
     * @param message - Message text to emit.
     * @param meta - Optional metadata to attach to the console call.
     * @example
     * import { Logger, LogLevel } from 'modules/logger';
     * const log = new Logger('App', { level: LogLevel.debug });
     *
     * log.debug("Entering critical section...");
     * try {
     *     log.info("Inside critical section.");
     *     if (typeof window == 'undefined') log.warn("Not isBrowser");
     * } catch (error) {
     *     log.error("Something went wrong!", { error: error });
     * } finally {
     *     log.debug("Exiting critical section...");
     * }
     */
    public debug(message: string, ...meta: any[]) {
        if (!this._levelEnabled(LogLevel.debug)) return
        const formattedMsg = this._formatMessage(LogLevel.debug, message);
        this._log(LogLevel.debug, formattedMsg, ...meta);
    }

    /**
     * Log a info-level message.
     *
     * @param message - Message text to emit.
     * @param meta - Optional metadata to attach to the console call.
     * @example
     * import { Logger, LogLevel } from 'modules/logger';
     * const log = new Logger('App', { level: LogLevel.info });
     *
     * log.debug("Entering critical section...");
     * try {
     *     log.info("Inside critical section.");
     *     if (typeof window == 'undefined') log.warn("Not isBrowser");
     * } catch (error) {
     *     log.error("Something went wrong!", { error: error });
     * } finally {
     *     log.debug("Exiting critical section...");
     * }
     */
    public info(message: string, ...meta: any[]) {
        if (!this._levelEnabled(LogLevel.info)) return
        const formattedMsg = this._formatMessage(LogLevel.info, message);
        this._log(LogLevel.info, formattedMsg, ...meta);
    }

    /**
     * Log a warn-level message.
     *
     * @param message - Message text to emit.
     * @param meta - Optional metadata to attach to the console call.
     * @example
     * import { Logger, LogLevel } from 'modules/logger';
     * const log = new Logger('App', { level: LogLevel.warn });
     *
     * log.debug("Entering critical section...");
     * try {
     *     log.info("Inside critical section.");
     *     if (typeof window == 'undefined') log.warn("Not isBrowser");
     * } catch (error) {
     *     log.error("Something went wrong!", { error: error });
     * } finally {
     *     log.debug("Exiting critical section...");
     * }
     */
    public warn(message: string, ...meta: any[]) {
        if (!this._levelEnabled(LogLevel.warn)) return
        const formattedMsg = this._formatMessage(LogLevel.warn, message);
        this._log(LogLevel.warn, formattedMsg, ...meta);
    }

    /**
     * Log a error-level message.
     *
     * @param message - Message text to emit.
     * @param meta - Optional metadata to attach to the console call.
     * @example
     * import { Logger, LogLevel } from 'modules/logger';
     * const log = new Logger('App', { level: LogLevel.error });
     *
     * log.debug("Entering critical section...");
     * try {
     *     log.info("Inside critical section.");
     *     if (typeof window == 'undefined') log.warn("Not isBrowser");
     * } catch (error) {
     *     log.error("Something went wrong!", { error: error });
     * } finally {
     *     log.debug("Exiting critical section...");
     * }
     */
    public error(message: string, ...meta: any[]) {
        if (!this._levelEnabled(LogLevel.error)) return
        const formattedMsg = this._formatMessage(LogLevel.error, message);
        this._log(LogLevel.error, formattedMsg, ...meta);
    }
}

/**
 * Shared default logger instance for application-wide use.
 *
 * @example
 * import log from 'modules/logger';
 *
 * log.debug("Entering critical section...");
 * try {
 *     log.info("Inside critical section.");
 *     if (typeof window == 'undefined') log.warn("Not isBrowser");
 * } catch (error) {
 *     log.error("Something went wrong!", { error: error });
 * } finally {
 *     log.debug("Exiting critical section...");
 * }
 */
const log = new Logger(undefined, { level: LogLevel.info });

export type {
    LoggerOptions
}

export {
    LogLevel,
    Logger,
}

export default log;
