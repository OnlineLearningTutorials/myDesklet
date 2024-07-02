const DEFAULT_ZENITH = 90.8333;
const DEGREES_PER_HOUR = 360 / 24;
const MSEC_IN_HOUR = 60 * 60 * 1000;
function getDayOfYear(date) {
  return Math.ceil((date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / 8.64e7);
}
function sinDeg(deg) {
  return Math.sin(deg * 2.0 * Math.PI / 360.0);
}
function acosDeg(x) {
  return Math.acos(x) * 360.0 / (2 * Math.PI);
}
function asinDeg(x) {
  return Math.asin(x) * 360.0 / (2 * Math.PI);
}
function tanDeg(deg) {
  return Math.tan(deg * 2.0 * Math.PI / 360.0);
}
function cosDeg(deg) {
  return Math.cos(deg * 2.0 * Math.PI / 360.0);
}
function mod(a, b) {
  const result = a % b;

  return result < 0
    ? result + b
    : result;
}
function calculate(latitude, longitude, isSunrise, zenith, date) {
  const dayOfYear = getDayOfYear(date);
  const hoursFromMeridian = longitude / DEGREES_PER_HOUR;
  const approxTimeOfEventInDays = isSunrise
    ? dayOfYear + ((6 - hoursFromMeridian) / 24)
    : dayOfYear + ((18.0 - hoursFromMeridian) / 24);

  const sunMeanAnomaly = (0.9856 * approxTimeOfEventInDays) - 3.289;
  const sunTrueLongitude = mod(sunMeanAnomaly + (1.916 * sinDeg(sunMeanAnomaly)) + (0.020 * sinDeg(2 * sunMeanAnomaly)) + 282.634, 360);
  const ascension = 0.91764 * tanDeg(sunTrueLongitude);

  let rightAscension;
  rightAscension = 360 / (2 * Math.PI) * Math.atan(ascension);
  rightAscension = mod(rightAscension, 360);

  const lQuadrant = Math.floor(sunTrueLongitude / 90) * 90;
  const raQuadrant = Math.floor(rightAscension / 90) * 90;
  rightAscension = rightAscension + (lQuadrant - raQuadrant);
  rightAscension /= DEGREES_PER_HOUR;

  const sinDec = 0.39782 * sinDeg(sunTrueLongitude);
  const cosDec = cosDeg(asinDeg(sinDec));
  const cosLocalHourAngle = ((cosDeg(zenith)) - (sinDec * (sinDeg(latitude)))) / (cosDec * (cosDeg(latitude)));

  const localHourAngle = isSunrise
    ? 360 - acosDeg(cosLocalHourAngle)
    : acosDeg(cosLocalHourAngle);

  const localHour = localHourAngle / DEGREES_PER_HOUR;
  const localMeanTime = localHour + rightAscension - (0.06571 * approxTimeOfEventInDays) - 6.622;
  const time = mod(localMeanTime - (longitude / DEGREES_PER_HOUR), 24);
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  // Created date will be set to local (system) time zone.
  return new Date(utcMidnight + (time * MSEC_IN_HOUR));
}

function getSunrise(latitude, longitude, date = new Date()) {
  return calculate(latitude, longitude, true, DEFAULT_ZENITH, date);
};

function getSunset(latitude, longitude, date = new Date()) {
  return calculate(latitude, longitude, false, DEFAULT_ZENITH, date);
};
