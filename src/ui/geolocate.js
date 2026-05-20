// Browser Geolocation API wrappers with friendly errors.

const coords = (pos) => ({
  lat: pos.coords.latitude,
  lng: pos.coords.longitude,
  accuracy: pos.coords.accuracy,
});

export function getCurrentPosition({ timeout = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(coords(pos)),
      (err) => reject(new Error(message(err))),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
}

/**
 * Continuously track position. Calls onUpdate({lat,lng,accuracy}) on each fix.
 * Returns a stop() function; calls onError(Error) if a fix fails.
 */
export function watchPosition({ onUpdate, onError } = {}) {
  if (!('geolocation' in navigator)) {
    onError?.(new Error('Geolocation is not available on this device.'));
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (pos) => onUpdate?.(coords(pos)),
    (err) => onError?.(new Error(message(err))),
    { enableHighAccuracy: true, timeout: 15_000, maximumAge: 2_000 }
  );
  return () => navigator.geolocation.clearWatch(id);
}

function message(err) {
  switch (err?.code) {
    case 1:
      return 'Location permission denied — enable it in Settings to use “I’m here”.';
    case 2:
      return 'Location unavailable right now. Try again in a moment.';
    case 3:
      return 'Getting your location timed out. Try again.';
    default:
      return 'Could not get your location.';
  }
}
