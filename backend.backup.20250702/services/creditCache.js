const cache = new Map(); // key: minute-timestamp, value: credits usados

module.exports = {
  add(credits = 1) {
    const nowMin = Math.floor(Date.now() / 60_000);
    cache.set(nowMin, (cache.get(nowMin) || 0) + credits);
  },
  getCurrentMinute() {
    const nowMin = Math.floor(Date.now() / 60_000);
    return cache.get(nowMin) || 0;
  }
}; 