export const PID_MAP = {
  '0104': { name: 'Engine Load', unit: '%', min: 0, max: 100, decoder: (A) => Math.round((A / 255) * 100) },
  '0105': { name: 'Coolant Temp', unit: '°C', min: -40, max: 215, decoder: (A) => A - 40 },
  '0106': { name: 'Short Term Fuel Trim Bank 1', unit: '%', min: -100, max: 99.2, decoder: (A) => ((A - 128) * 100) / 128 },
  '0107': { name: 'Long Term Fuel Trim Bank 1', unit: '%', min: -100, max: 99.2, decoder: (A) => ((A - 128) * 100) / 128 },
  '010B': { name: 'Intake Manifold Pressure', unit: 'kPa', min: 0, max: 255, decoder: (A) => A },
  '010C': { name: 'RPM', unit: 'rpm', min: 0, max: 16383, decoder: (A, B) => ((A * 256) + B) / 4 },
  '010D': { name: 'Speed', unit: 'km/h', min: 0, max: 255, decoder: (A) => A },
  '010E': { name: 'Timing Advance', unit: '°', min: -64, max: 63.5, decoder: (A) => (A - 128) / 2 },
  '010F': { name: 'Intake Air Temp', unit: '°C', min: -40, max: 215, decoder: (A) => A - 40 },
  '0110': { name: 'MAF Air Flow Rate', unit: 'g/s', min: 0, max: 655.35, decoder: (A, B) => ((A * 256) + B) / 100 },
  '0111': { name: 'Throttle Position', unit: '%', min: 0, max: 100, decoder: (A) => Math.round((A / 255) * 100) },
  '011F': { name: 'Run Time Since Engine Start', unit: 'sec', min: 0, max: 65535, decoder: (A, B) => (A * 256) + B },
  '0121': { name: 'Distance Traveled with MIL On', unit: 'km', min: 0, max: 65535, decoder: (A, B) => (A * 256) + B },
  '012F': { name: 'Fuel Tank Level Input', unit: '%', min: 0, max: 100, decoder: (A) => Math.round((A / 255) * 100) },
  '0133': { name: 'Barometric Pressure', unit: 'kPa', min: 0, max: 255, decoder: (A) => A },
  '0142': { name: 'Control Module Voltage', unit: 'V', min: 0, max: 65.535, decoder: (A, B) => ((A * 256) + B) / 1000 },
  '0143': { name: 'Absolute Load Value', unit: '%', min: 0, max: 25700, decoder: (A, B) => Math.round(((A * 256) + B) * 100 / 255) },
  '0144': { name: 'Command Equivalence Ratio', unit: 'ratio', min: 0, max: 2, decoder: (A, B) => ((A * 256) + B) / 32768 },
  '0145': { name: 'Relative Throttle Position', unit: '%', min: 0, max: 100, decoder: (A) => Math.round((A / 255) * 100) },
  '0146': { name: 'Ambient Air Temp', unit: '°C', min: -40, max: 215, decoder: (A) => A - 40 },
  '015C': { name: 'Engine Oil Temp', unit: '°C', min: -40, max: 210, decoder: (A) => A - 40 },
};

export const decodePID = (pid, bytes) => {
  const definition = PID_MAP[pid];
  if (!definition) return null;

  const A = bytes[0] || 0;
  const B = bytes[1] || 0;
  const C = bytes[2] || 0;
  const D = bytes[3] || 0;

  const value = definition.decoder(A, B, C, D);
  return {
    name: definition.name,
    value: typeof value === 'number' ? Number(value.toFixed(2)) : value,
    unit: definition.unit,
    min: definition.min,
    max: definition.max
  };
};
