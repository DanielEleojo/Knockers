// Promise wrapper around the browser Geolocation API with friendly errors.

export function getCurrentPosition({ timeout = 10_000 } = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation is not available on this device.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) => reject(new Error(message(err))),
      { enableHighAccuracy: true, timeout, maximumAge: 0 }
    );
  });
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
