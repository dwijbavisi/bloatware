import React, { useState, useEffect } from 'react';

interface LogMessage {
    id: string;
    timestamp: string;
    channel: 'passive' | 'alarm' | 'power' | 'clock' | 'signal';
    message: string;
}

export const ComponentGallery: React.FC<{
    onToast: (msg: string) => void;
}> = ({ onToast }) => {
    // Interactive component states
    const [powerState, setPowerState] = useState(true);
    const [clockSync, setClockSync] = useState(true);
    const [signalActive, setSignalActive] = useState(false);
    const [alarmTriggered, setAlarmTriggered] = useState(false);
    const [voltageLevel, setVoltageLevel] = useState(3.3);

    // Live terminal log messages
    const [logs, setLogs] = useState<LogMessage[]>([
        { id: '1', timestamp: '00:00:01.002', channel: 'power', message: 'VCC power delivery stabilized at 3.30V nominal.' },
        { id: '2', timestamp: '00:00:01.014', channel: 'clock', message: 'Crystal oscillator PLL lock established at 144.00 MHz.' },
        { id: '3', timestamp: '00:00:01.045', channel: 'signal', message: 'UART / SPI bus transceiver listening on channel 0x06.' },
        { id: '4', timestamp: '00:00:01.092', channel: 'passive', message: 'Semiconductor substrate ground plane impedance verified (< 0.05 ohm).' }
    ]);

    const addLog = (channel: LogMessage['channel'], message: string) => {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
        setLogs(prev => [
            { id: Math.random().toString(36).substring(2, 9), timestamp: timeStr, channel, message },
            ...prev.slice(0, 19)
        ]);
    };

    const handleAlarmTest = () => {
        const next = !alarmTriggered;
        setAlarmTriggered(next);
        if (next) {
            addLog('alarm', 'CRITICAL FAULT: Watchdog interrupt invoked on INT0! Thermal or parity trip.');
            onToast('ALARM: Critical Watchdog Interrupt Triggered!');
        } else {
            addLog('alarm', 'Watchdog interrupt cleared. Nominal telemetry restored.');
            onToast('Alarm cleared.');
        }
    };

    const handleSignalBurst = () => {
        setSignalActive(true);
        addLog('signal', 'TX packet [0x7E 0x01 0xA4 0x22]: 64 bytes sent over cyan bus.');
        onToast('Signal Burst Transmitted');
        setTimeout(() => setSignalActive(false), 600);
    };

    const handleClockToggle = () => {
        const next = !clockSync;
        setClockSync(next);
        addLog('clock', next ? 'Clock sync pulse re-enabled @ 144MHz.' : 'Clock sync suspended. Drift accumulator running.');
        onToast(`Clock sync ${next ? 'engaged' : 'suspended'}`);
    };

    const handlePowerToggle = () => {
        const next = !powerState;
        setPowerState(next);
        addLog('power', next ? 'Main power rail energized.' : 'Main power rail placed in low-leakage standby.');
        onToast(`Power rail ${next ? 'ON' : 'STANDBY'}`);
    };

    return (
        <section className="showcase-section" id="component-gallery">
            <div className="section-head">
                <div className="section-title-wrap">
                    <span className="section-tag">UI Construction</span>
                    <h2 className="section-title">Biocircuit Component Gallery</h2>
                    <p className="section-desc">
                        Modular user interface components built strictly with Biocircuit design tokens, topological surface layers,
                        and electronic channel semantics.
                    </p>
                </div>
            </div>

            {/* Interactive Control & Action Matrix */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Channel Buttons Card */}
                <div className="surface-card surface-die">
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Channel Action Triggers
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Each button is bound to its channel substrate, text, and border glow tokens.
                    </p>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <button
                            className="demo-btn demo-btn-signal"
                            onClick={handleSignalBurst}
                            style={{
                                transform: signalActive ? 'scale(0.96)' : undefined,
                                boxShadow: signalActive ? '0 0 20px rgba(6, 182, 212, 0.8)' : undefined
                            }}
                        >
                            <span>Transmit Signal</span>
                            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>[0x06]</span>
                        </button>

                        <button
                            className="demo-btn demo-btn-clock"
                            onClick={handleClockToggle}
                        >
                            <span>Clock Sync: {clockSync ? '144MHz' : 'OFF'}</span>
                        </button>

                        <button
                            className="demo-btn demo-btn-power"
                            onClick={handlePowerToggle}
                        >
                            <span>Power: {powerState ? 'ACTIVE' : 'STANDBY'}</span>
                        </button>

                        <button
                            className="demo-btn demo-btn-alarm"
                            onClick={handleAlarmTest}
                        >
                            <span>{alarmTriggered ? 'Clear Alarm' : 'Trip Alarm'}</span>
                        </button>

                        <button
                            className="demo-btn demo-btn-passive"
                            onClick={() => {
                                addLog('passive', 'Ground plane reference probe sampled: 0.000V.');
                                onToast('Ground probed');
                            }}
                        >
                            <span>Probe Ground</span>
                        </button>
                    </div>
                </div>

                {/* Micro-electronic Telemetry Card */}
                <div className="surface-card surface-die">
                    <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem', color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-die)' }}>
                        Live Telemetry Gauges
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                        Hardware telemetry widgets showing voltages, clock synchronization, and bus status.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                        <div className="surface-card surface-panel channel-power" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-power)', textTransform: 'uppercase' }}>
                                VCC Rail
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                                {powerState ? `${voltageLevel.toFixed(2)}V` : '0.00V'}
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                                {powerState ? 'Nominal +/-0.5%' : 'Rail Inactive'}
                            </div>
                        </div>

                        <div className="surface-card surface-panel channel-clock" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-clock)', textTransform: 'uppercase' }}>
                                PLL Frequency
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                                {clockSync ? '144.00 MHz' : 'HOLD'}
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                                {clockSync ? 'Locked (Phase 0°)' : 'Unlocked'}
                            </div>
                        </div>

                        <div className="surface-card surface-panel channel-signal" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-signal)', textTransform: 'uppercase' }}>
                                Bus Transceiver
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                                {signalActive ? 'BURST' : 'IDLE'}
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                                115,200 Baud &bull; 8-N-1
                            </div>
                        </div>

                        <div className="surface-card surface-panel channel-alarm" style={{ padding: '0.75rem' }}>
                            <div style={{ fontSize: '0.65rem', color: 'var(--accent-alarm)', textTransform: 'uppercase' }}>
                                Watchdog Status
                            </div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '2px' }}>
                                {alarmTriggered ? 'TRIPPED' : 'CLEAR'}
                            </div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.7, marginTop: '2px' }}>
                                {alarmTriggered ? 'Fault Code: 0xDEAD' : 'Zero Exceptions'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostic Terminal Stream */}
            <div className="terminal-window">
                <div className="terminal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="telemetry-dot" />
                        <span style={{ fontWeight: 700, color: 'var(--cwbwbc-biocircuit-channel-passive-text-on-canvas)' }}>
                            BIOCIRCUIT HARDWARE BUS TELEMETRY STREAM
                        </span>
                    </div>
                    <button
                        onClick={() => setLogs([])}
                        style={{
                            background: 'transparent',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '4px',
                            color: 'var(--cwbwbc-biocircuit-color-titanium-white-400)',
                            padding: '0.15rem 0.5rem',
                            cursor: 'pointer',
                            fontSize: '0.65rem',
                            fontFamily: 'var(--font-mono)'
                        }}
                    >
                        Clear Buffer
                    </button>
                </div>

                <div className="terminal-lines">
                    {logs.length === 0 ? (
                        <div style={{ color: 'var(--cwbwbc-biocircuit-color-titanium-white-600)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                            Telemetry buffer empty. Trigger channel actions above to generate events.
                        </div>
                    ) : (
                        logs.map((log) => {
                            let badgeColor = 'var(--cwbwbc-biocircuit-color-electric-cyan-400)';
                            if (log.channel === 'alarm') badgeColor = 'var(--cwbwbc-biocircuit-color-blaze-vermilion-400)';
                            if (log.channel === 'power') badgeColor = 'var(--cwbwbc-biocircuit-color-solar-amber-400)';
                            if (log.channel === 'clock') badgeColor = 'var(--cwbwbc-biocircuit-color-laser-emerald-400)';

                            return (
                                <div key={log.id} className="terminal-line">
                                    <span className="terminal-ts">[{log.timestamp}]</span>
                                    <span style={{ color: badgeColor, fontWeight: 700, minWidth: '65px' }}>
                                        [{log.channel.toUpperCase()}]
                                    </span>
                                    <span className="terminal-msg">{log.message}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </section>
    );
};
