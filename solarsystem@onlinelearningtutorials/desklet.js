const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Desklet = imports.ui.desklet;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Tooltips = imports.ui.tooltips;
const Util = imports.misc.util;
const Clutter = imports.gi.Clutter;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Cogl = imports.gi.Cogl;
const UUID = "solarsystem@onlinelearningtutorials";
const DESKLET_ROOT = imports.ui.deskletManager.deskletMeta["solarsystem@onlinelearningtutorials"].path;
const Astronomy = imports.ui.deskletManager.desklets[UUID].astronomy;
 const BodyList = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
let latitude = 27.3426;
        let longitude = 77.3726;
        let elevation = 0;
        let observer = Astronomy.MakeObserver(latitude, longitude, elevation);
var n_karan, n_kar, karanaend, karanaendhms, displayDate, tzone, julianDays, vaaram, ayanamsa, sunDegrees, moonDeg, nakshatra, tithi, nakshatraend, nakshatraendhms, tithiend, tithiendhms, n_yoga, yogaend, jdt, z, iyog, Lsun0, Lmoon0, dmoonYoga, dsunYoga, asp1, z1, z2, f, alf, a, b, d, c, e, days, kday, kmon, kyear, hh1, khr, kmin, ksek, s, tithiDeg, nakshatraDeg;

function MyDesklet(metadata) {
    this._init(metadata);
}
function getImage(imageFileName) {
	let pixBuf = GdkPixbuf.Pixbuf.new_from_file(imageFileName);
	let image = new Clutter.Image();
	image.set_data(
		pixBuf.get_pixels(),
		pixBuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888 : Cogl.PixelFormat.RGBA_888,
		pixBuf.get_width(),
    pixBuf.get_height(),
		pixBuf.get_rowstride()
	);

	let actor = new Clutter.Actor({width: pixBuf.get_width(), height: pixBuf.get_height()});
	actor.set_content(image);

	return actor;
}
MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata) {
        Desklet.Desklet.prototype._init.call(this, metadata);
        this._solar = new St.Bin();
        this._solarContainer = new St.Group();

        this._mainContainer = new St.BoxLayout({ vertical: true});

        this._calenderContainer = new St.BoxLayout({ vertical: true, style_class: 'solar-calender-container' });

        this._tithi = new St.Label({style_class: 'solar-tithi-container'});
        this._tithiButton = new St.Button({child: this._tithi, style_class: 'solar-tithi-container'});
        this._nakshtra = new St.Label({style_class: 'solar-nakshtra-container'});
        this._date = new St.Label({ style_class: 'solar-date-container' });
        this._month = new St.Label({ style_class: 'solar-month-container' });
        this._time = new St.Label({ style_class: 'solar-time-container' });

        this._dateContainer = new St.BoxLayout({});
        this._monthContainer = new St.BoxLayout({vertical: true, style_class: 'solar-dateappend-container'});
        this._vaar = new St.Label({style_class: 'solar-month-container'});
        this._monthContainer.add(this._vaar);
        this._monthContainer.add(this._month);
        this._dateContainer.add(this._date);
        this._dateContainer.add(this._monthContainer);

        //this._calenderContainer.add(this._tithiButton);
        this._calenderContainer.add(this._nakshtra);
        this._calenderContainer.add(this._dateContainer);
        this._calenderContainer.add(this._time);
        this._mainContainer.add(this._calenderContainer);

        this._bg_img = getImage(DESKLET_ROOT+"/img/zodiac_anti.svg");
        this._bg_img_month = getImage(DESKLET_ROOT+"/img/month.svg");
        this._bg_img_nakshtra = getImage(DESKLET_ROOT+"/img/nakshtra.svg");
        
        this._sun_img = getImage(DESKLET_ROOT+"/img/sun.svg");
        this._moon_img = getImage(DESKLET_ROOT+"/img/moon.svg");
        this._venus_img = getImage(DESKLET_ROOT+"/img/venus.png");
        this._mars_img = getImage(DESKLET_ROOT+"/img/mars.png");
        this._ascendant_img = getImage(DESKLET_ROOT+"/img/ascendant_anti.svg");
        this._mercury_img = getImage(DESKLET_ROOT+"/img/mercury.png");
        this._jupiter_img = getImage(DESKLET_ROOT+"/img/jupiter.png");
        this._saturn_img = getImage(DESKLET_ROOT+"/img/saturn.png")
        //this._bg_img.set_width(400);
        //this._bg_img.set_height(400);
        //this._bg_img.set_position(-100,-100);
        this._bg_img_month.set_pivot_point(0.5,0.5);
        this._bg_img_nakshtra.set_pivot_point(0.5,0.5);
        this._bg_img.set_pivot_point(0.5,0.5);
        this._sun_img.set_pivot_point(0.5,0.5);
        this._moon_img.set_pivot_point(0.5,0.5);
        this._venus_img.set_pivot_point(0.5,0.5);
        this._mars_img.set_pivot_point(0.5,0.5);
        this._mercury_img.set_pivot_point(0.5,0.5);
        this._jupiter_img.set_pivot_point(0.5, 0.5);
        this._saturn_img.set_pivot_point(0.5,0.5);
        this._solarContainer.add_actor(this._bg_img_month);
        //this._solarContainer.add_actor(this._bg_img_nakshtra);
        this._solarContainer.add_actor(this._bg_img);
        this._solarContainer.add_actor(this._sun_img);
        this._solarContainer.add_actor(this._moon_img);
        this._solarContainer.add_actor(this._venus_img);
        this._solarContainer.add_actor(this._mars_img);
        this._solarContainer.add_actor(this._mercury_img);
        this._solarContainer.add_actor(this._jupiter_img);
        this._solarContainer.add_actor(this._saturn_img);
        this._solarContainer.add_actor(this._ascendant_img);
        this._solarContainer.add_actor(this._mainContainer);
        this._mainContainer.set_position(200,200);
        this._solar.add_actor(this._solarContainer);
        this._tooltiptithi = new Tooltips.Tooltip(this._tithiButton);

        this.sidereal = {};
        this.setContent(this._solar);
        this.setHeader("Panchang");
        this._updateDate();
    },

    on_desklet_removed: function() {
        Mainloop.source_remove(this.timeout);
    },

    _updateDate: function() {

        displayDate = new Date();
        tzone = displayDate.getTimezoneOffset() / 60 * (-1);
        julianDays = toJulian(displayDate);
        vaaram = weekDay(julianDays);
        ayanamsa = calcayan(julianDays);
        sunDegrees = sun(julianDays);
        moonDeg = moon(julianDays);
        nakshatraDeg = fix360(moonDeg + ayanamsa);
        nakshatra = Math.floor( nakshatraDeg * 6 / 80);
        tithiDeg = fix360(moonDeg - sunDegrees);
        tithi = Math.floor( tithiDeg / 12);
        nakshatraend = fromJulian(nakshatra_end(julianDays, nakshatra, ayanamsa));
        tithiend = fromJulian(tithi_end(julianDays, tithi, 12));
        n_yoga = Math.floor((sunDegrees + moonDeg + 2 * ayanamsa - 528119.989395531) * 6 / 80);
        var str_vaar = "";
        var suna = Astronomy.Equator("Sun", displayDate, observer, false, true);
        str_vaar += "\nSun:  "+(suna.ra);
        var moona = Astronomy.Equator("Moon", displayDate, observer, false, true);
        str_vaar += "\nMoo:  "+(moona.ra);
        var mars = Astronomy.Equator("Mars", displayDate, observer, false, true);
        str_vaar += "\nMar:  "+(mars.ra);
        var mercury = Astronomy.Equator("Mercury", displayDate, observer, false, true);
        str_vaar += "\nMer:  "+(mercury.ra);
        var jupiter = Astronomy.Equator("Jupiter", displayDate, observer, false, true);
        str_vaar += "\nJup:  "+(jupiter.ra);
        var venus = Astronomy.Equator("Venus", displayDate, observer, false, true);
        str_vaar += "\nVen:  "+(venus.ra);
        var saturn = Astronomy.Equator("Saturn", displayDate, observer, false, true);
        str_vaar += "\nSat:  "+(saturn.ra);
        str_vaar += "\nTithi:"+parseInt(suna.ra-moona.ra)+" "+tith[parseInt((moona.ra-suna.ra)/12)];
        str_vaar += "\nNak:"+parseInt(moona.ra)+" "+naks[parseInt((moona.ra+ayanamsa)*27/360)];



        //kumher latitude, longitude 27.3426° N, 77.3726° E
        //mathura 27.4924° N, 77.6737° E
        //Gwalior 26.2183° N, 78.1828° E
        //Agra  27.1767° N, 78.0081° E
        var ascendant = getAscendant(julianDays,27.3426,77.3726);
        this._bg_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, -ascendant-ayanamsa);
        this._bg_img_month.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, -ascendant);
        this._bg_img_nakshtra.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, -ascendant-ayanamsa);
        
        this._sun_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+suna.ra);
        this._moon_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+moona.ra);
        this._venus_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+(venus.ra));
        this._mars_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+(mars.ra));
        this._mercury_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+(mercury.ra));
        this._jupiter_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+(jupiter.ra));
        this._saturn_img.set_rotation_angle(Clutter.RotateAxis.Z_AXIS, 180-ascendant+(saturn.ra));


        var sunrise_time = getSunrise(27.3426, 77.3726);

        while (n_yoga < 0) n_yoga += 27;
        while (n_yoga > 27) n_yoga -= 27;
        n_karan = n_karana(moonDeg, sunDegrees, julianDays);
        this._tooltiptithi.set_text("End time: "+tithiend.toString());
        //karanaendhms = " "+parseInt((karanaend-displayDate)/3600000)+":"+parseInt(((karanaend-displayDate)/60000)%60)+":"+parseInt(((karanaend-displayDate)/1000)%60);

        //this._vaar.set_text(" "+Math.floor((vaaram*24)%24)+":"+Math.floor((vaaram*24*60)%60)+":"+Math.floor((vaaram*24*60*60)%60)+"\n"+wd[Math.floor(vaaram)]);
        this._vaar.set_text(displayDate.toLocaleFormat("%H:%M:%S"));
        this._time.set_text(sunrise_time.toLocaleFormat(wd[Math.floor(vaaram)]+"\n सूर्योदय: %H:%M:%S"));
        this._date.set_text(displayDate.toLocaleFormat("%e"));
        this._month.set_text(displayDate.toLocaleFormat("%B, %Y"));
        //this._tithi.set_text();
        this._nakshtra.set_text(tithiii[tithi] + "("+Math.floor(tithiDeg)+") " + tithiend.toLocaleFormat(" %H:%M, %e")+"\n"+naks[nakshatra]+"("+Math.floor(nakshatraDeg)+") "+ nakshatraend.toLocaleFormat(" %H:%M, %e"));


        this.timeout = Mainloop.timeout_add_seconds(30, Lang.bind(this, this._updateDate));

    }
}

function main(metadata, desklet_id) {
    let desklet = new MyDesklet(metadata, desklet_id);
    return desklet;
}

function format_zodiac(ra) {


    var degree = ra;
    var zn = parseInt(degree/30);
    var dg = parseInt(degree%30);
    var mi = parseInt((60*degree)%60);
    var se = parseInt((3600*degree)%60);
    return zodiacen[zn]+zodiachi[zn]+" "+dg+" "+mi+" "+se;
}
function getAscendant(jd, latitude, longitude) {
    // jd since 2000
    jd = jd - 2451545;
    var obliquityEcliptic=23.4367;
    var lst = (280.46061837 + (360.98564736629 * (jd)) + 0.000387933 * Math.pow(jd/36525, 2) - (Math.pow(jd/36525, 3) / 38710000) + longitude)%360;
    //global.log("sidereal time:"+lst);
    var d = (Math.sin(obliquityEcliptic*Math.PI/180) * Math.tan(latitude*Math.PI/180))+(Math.cos(obliquityEcliptic*Math.PI/180) * Math.sin(lst*Math.PI/180));
    var ascendant = (180/Math.PI)*Math.atan(-Math.cos(lst*Math.PI/180)/d);
    if(ascendant < 0) ascendant+=360;
    if (d < 0) {
    ascendant += 180
  } else {
    ascendant += 360
  }
  if (ascendant >= 180) {
    ascendant -= 180
  }
    return ascendant;
}



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
function getSunrise(latitude, longitude, date = new Date()) {
  // return calculate(latitude, longitude, true, DEFAULT_ZENITH, date);
const zenith = 90.8333;
const DEGREES_PER_HOUR = 360 / 24;
const MSEC_IN_HOUR = 60 * 60 * 1000;
  const dayOfYear = getDayOfYear(date);
  const hoursFromMeridian = longitude / DEGREES_PER_HOUR;
  const approxTimeOfEventInDays = dayOfYear + ((6 - hoursFromMeridian) / 24);

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

  const localHourAngle = 360 - acosDeg(cosLocalHourAngle);

  const localHour = localHourAngle / DEGREES_PER_HOUR;
  const localMeanTime = localHour + rightAscension - (0.06571 * approxTimeOfEventInDays) - 6.622;
  const time = mod(localMeanTime - (longitude / DEGREES_PER_HOUR), 24);
  const utcMidnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());

  // Created date will be set to local (system) time zone.
  return new Date(utcMidnight + (time * MSEC_IN_HOUR));
};


var panchang = {};
panchang.tithi = {};
panchang.tithi.end = 0;
panchang.nakshtra = {};
panchang.nakshtra.end = 0;

var e = 23.4397 * Math.PI / 180; // obliquity of the Earth
var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    J2000 = 2451545;
var date = new Date();
var dayMs = 1000 * 60 * 60 * 24,
    J1970 = 2440588,
    jd0, jdn, dn1, wday, nk,
    J2000 = 2451545;

var tithiii = ["१ शु०","२ शु०","३ शु०","४ शु०","५ शु०","६ शु०","७ शु०","८ शु०","९ शु०","१० शु०","११ शु०","१२ शु०","१३ शु०","१४ शु०","१५ शु०","१ कृ०","२ कृ०","३ कृ०","४ कृ०","५ कृ०","६ कृ०","७ कृ०","८ कृ०","९ कृ०","१० कृ०","११ कृ०","१२ कृ०","१३ कृ०","१४ कृ०","३० कृ०",];
var wd = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];
var maasam = [" चैत्र", " वैशाख", " ज्येष्ठ", " आषाढ़", " श्रावण", " भाद्रपक्ष", " आश्विन", " कार्तिक", " मार्गशीष", " पौष", " माघ", " फाल्गुन"];
var naks = ["अश्विनी", "भरणी", "कृत्तिका", "रोहिणी", "मृगशिरा", "आर्द्रा", "पुनर्वसु", "पुष्य", "अश्लेषा", "मघा", "पूर्वाफाल्गुनी", "उत्तराफाल्गुनी", "हस्त", "चित्रा", "स्वाती", "विशाखा", "अनुराधा", "ज्येष्ठा", "मुल", "पुर्वाषाढा", "उत्तरषाढा", "श्रवण", "धनिष्ठा", "शतभिषा", "पूर्वभाद्रपद", "उत्तरभाद्रपद", "रेवती"];
var tith = ["शुक्ल प्रतिपदा", "शुक्ल द्वितीया", "शुक्ल तृतीया", "शुक्ल चतुर्थी", "शुक्ल पंचमी", "शुक्ल षष्ठी", "शुक्ल सप्तमी", "शुक्ल अष्टमी", "शुक्ल नवमी", "शुक्ल दशमी", "शुक्ल एकादशी", "शुक्ल द्वादशी", "शुक्ल त्रयोदशी", "शुक्ल चतुर्दशी", "शुक्ल पूर्णिमा", "कृष्ण प्रतिपदा", "कृष्ण द्वितीया", "कृष्ण तृतीया", "कृष्ण चतुर्थी", "कृष्ण पंचमी", "कृष्ण षष्ठी", "कृष्ण सप्तमी", "कृष्ण अष्टमी", "कृष्ण नवमी", "कृष्ण दशमी", "कृष्ण एकादशी", "कृष्ण द्वादशी", "कृष्ण त्रयोदशी", "कृष्ण चतुर्दशी", "कृष्ण अमावस्या"];
var kar = ["बव", "बालव", "कौलव", "तैतिल", "गर", "वणिज", "विष्टी", "शकुनी", "चतुष्पद", "नाग", "किंस्तुघ्न"];
var yog = ["विष्कुंभ", "प्रिति", "आयुष्मान", "सौभाग्य", "शोभन", "अतिगण्ड", "सुकर्मा", "धृति", "शूल", "गण्ड", "बृद्धि", "ध्रुव", "व्यघात", "हर्षण", "वज्र", "सिद्धि", "व्यतिपात", "वरियान", "परिध", "शिव", "सिद्ध", "साध्य", "शुभ", "शुक्ल", "ब्रह्म", "ऐन्द्र", "वैधृति"];
var tipnaks = [2, 5, 6, 0, 1, 4, 3, 2, 4, 5, 5, 0, 2, 1, 3, 6, 1, 4, 4, 5, 0, 3, 3, 3, 5, 0, 1];
let zodiacen = ["Aries","Taurus","Gemini","Cancer","Leo","Virgo","Libra","Scorpio","Sagittarius","Capricorn","Aquarius","Pisces",];
let zodiachi = ["मेष","वृष","मिथुन","कर्क","सिंह","कन्या","तुला","वृश्चिक","धनु","मकर","कुंभ","मीन",];
var Lmoon, Lsun, skor, LmoonYoga, LsunYoga, dt;
var ayanamsa = 0;

function toJulian(date) {
    return date.valueOf() / dayMs - 0.5 + J1970;
}

function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
}

function rightAscension(l, b) {
    return Math.atan2(Math.sin(l) * Math.cos(e) - Math.tan(b) * Math.sin(e), Math.cos(l));
}

function declination(l, b) {
    return Math.asin(Math.sin(b) * Math.cos(e) + Math.cos(b) * Math.sin(e) * Math.sin(l));
}

function weekDay(jd) {
    // Julian date for the begin of the day
    wday = ((1.5+(5.5/24)+jd)%7);

    return wday;
}


function fix360(v) {
    while (v < 0.0) v += 360.0;
    while (v > 360.0) v -= 360.0;
    return v;
}

function kepler(m, ex, err) {
    var u0, delta;
    //kepler = {};
    m = m;
    ex = ex;
    err = err;
    //val u0, delta;
    m *= Math.PI / 180;
    u0 = m;
    err *= Math.PI / 180;
    delta = 1;
    while (Math.abs(delta) >= err) {
        delta = (m + ex * Math.sin(u0) - u0) / (1 - ex * Math.cos(u0));
        u0 += delta;
    }
    return u0;
}

function nutation(jd) {
    var t, t2, ls, l, ms, ml, d, om, d2, l2, ls2, nut;
    //nutation = {};
    jd = jd;
    t = (jd - 2415020) / 36525;
    t2 = t * t;

    // avg len sun
    ls = 279.6967 + 36000.7689 * t + 0.000303 * t2;
    // avg len moon
    l = 270.4341639 + 481267.8831417 * t - 0.0011333333 * t2;
    // avg anomaly sun
    ms = 358.4758333333334 + 35999.04974999958 * t - t2 * 1.500000059604645e-4;
    // avg anomaly moon
    ml = 296.1046083333757 + 477198.8491083336 * t + 0.0091916667090522 * t2;
    // the diff medium len of moon and sun (avg elongation moon)
    d = 350.7374861110581 + 445267.1142166667 * t - t2 * 1.436111132303874e-3;

    om = 259.1832750002543 - 1934.142008333206 * t + .0020777778 * t2;
    ls *= Math.PI / 180;
    l *= Math.PI / 180;
    ms *= Math.PI / 180;
    ml *= Math.PI / 180;
    d *= Math.PI / 180;
    om *= Math.PI / 180;
    d2 = d * d;
    l2 = l * l;
    ls2 = ls * ls;


    nut = (-17.2327 - 0.01737 * t) * Math.sin(om);
    nut += 0.2088 * Math.sin(2.0 * om);
    nut += 0.0675 * Math.sin(ml);
    nut -= 0.0149 * Math.sin(ml - d2);
    nut -= 0.0342 * Math.sin(l2 - om);
    nut += 0.0114 * Math.sin(l2 - ml);
    nut -= 0.2037 * Math.sin(l2);
    nut -= 0.0261 * Math.sin(l2 + ml);
    nut += 0.0124 * Math.sin(ls2 - om);
    nut += 0.0214 * Math.sin(ls2 - ms);
    nut -= 1.2729 * Math.sin(ls2);
    nut -= 0.0497 * Math.sin(ls2 + ms);
    nut += 0.1261 * Math.sin(ms);
    nut = nut / 3600.0;

    return nut;
}

function sun(jd) {
    var tdays, t, t2, t3, ls, pes, ms, g, oms, ex, l, ml, le, om, u, u1, u2, u3, u4, u5, u6, il, dl, dr, b, truanom;
    var r1, rs, ab, LsunYoga;
    //sun = {};
    jd = jd;
    // days frm 1900:
    tdays = jd - 2415020;

    t = tdays / 36525;
    t2 = t * t;
    t3 = t * t * t;

    // the avg len sun

    ls = 279.696678 + 0.9856473354 * tdays + 1.089 * t2 / 3600;
    // perigee sun
    pes = 101.220833 + 6189.03 * t / 3600 + 1.63 * t2 / 3600 + 0.012 * t3 / 3600;
    // avg anomoly sun

    ms = fix360(ls - pes + 180);
    g = ms + (0.266 * Math.sin((31.8 + 119.0 * t) * Math.PI / 180) + 6.40 * Math.sin((231.19 + 20.2 * t) * Math.PI / 180) + (1.882 - 0.016 * t) * Math.sin((57.24 + 150.27 * t) * Math.PI / 180)) / 3600.0;
    // Rising sun node len
    oms = 259.18 - 1934.142 * t;
    // eccentricity orbit sun
    ex = 0.01675104 - 0.0000418 * t - 0.000000126 * t2;
    // avg length moon
    l = 270.4337361 + 13.176396544528099 * tdays - 5.86 * t2 / 3600 + 0.0068 * t3 / 3600;
    // avg anomaly moon
    ml = 296.1046083333757 + 477198.8491083336 * t + 0.0091916667090522 * t2 + 0.0000143888893 * t3;
    // avg len earth
    le = 99.696678 + 0.9856473354 * tdays + 1.089 * t2 / 3600;

    om = 259.183275 - 6962911.23 * t / 3600 + 7.48 * t2 / 3600 + 0.008 * t3 / 3600;

    // eccentric anomoloy calculation iterative method
    u = kepler(g, ex, 0.0000003);


    // cal true anomaly sun
    b = Math.sqrt((1 + ex) / (1 - ex));
    if (Math.abs(Math.PI - u) < 1.0e-10) truanom = u;
    else truanom = 2.0 * Math.atan(b * Math.tan(u / 2));
    truanom = fix360(truanom * 180 / Math.PI);

    //corrections for cal of longitude and radius vector
    u1 = (153.23 + 22518.7541 * t) * Math.PI / 180;
    u2 = (216.57 + 45037.5082 * t) * Math.PI / 180;
    u3 = (312.69 + 32964.3577 * t) * Math.PI / 180;
    u4 = (350.74 + 445267.1142 * t - 0.00144 * t2) * Math.PI / 180;
    u6 = (353.4 + 65928.71550000001 * t) * Math.PI / 180;
    u5 = (315.6 + 893.3 * t) * Math.PI / 180;

    dl = 0.00134 * Math.cos(u1);
    dl += 0.00154 * Math.cos(u2);
    dl += 0.002 * Math.cos(u3);
    dl += 0.00179 * Math.sin(u4);
    dl += 0.202 * Math.sin(u5) / 3600;

    dr = 0.00000543 * Math.sin(u1);
    dr += 0.00001575 * Math.sin(u2);
    dr += 0.00001627 * Math.sin(u3);
    dr += 0.00003076 * Math.cos(u4);
    dr += 9.26999999e-06 * Math.sin(u6);

    // true len of sun (deg)
    il = ls + dl + truanom - ms;

    // corrections to abberations links
    r1 = 1.0000002 * (1 - ex * ex) / (1 + ex * Math.cos(truanom * Math.PI / 180));
    rs = r1 + dr; // radius vector
    ab = (20.496 * (1 - ex * ex) / rs) / 3600;
    ls = il + nutation(jd) - ab; // app len sun
    LsunYoga = ls;

    ls = fix360(ls);

    return ls;
}

function corr(mlcor, mscor, fcor, dcor, lcor) {
    this.mlcor = mlcor;
    this.mscor = mscor;
    this.fcor = fcor;
    this.dcor = dcor;
    this.lcor = lcor;
}

function corr2(l, ml, ms, f, d) {
    this.l = l;
    this.ml = ml;
    this.ms = ms;
    this.f = f;
    this.d = d;
}

var corrMoon = new Array(); // main
var i = 0;
// ml, ms, f, d, l
corrMoon[i++] = new corr(0, 0, 0, 4, 13.902);
corrMoon[i++] = new corr(0, 0, 0, 2, 2369.912);
corrMoon[i++] = new corr(1, 0, 0, 4, 1.979);
corrMoon[i++] = new corr(1, 0, 0, 2, 191.953);
corrMoon[i++] = new corr(1, 0, 0, 0, 22639.500);
corrMoon[i++] = new corr(1, 0, 0, -2, -4586.465);
corrMoon[i++] = new corr(1, 0, 0, -4, -38.428);
corrMoon[i++] = new corr(1, 0, 0, -6, -0.393);
corrMoon[i++] = new corr(0, 1, 0, 4, -0.289);
corrMoon[i++] = new corr(0, 1, 0, 2, -24.420);
corrMoon[i++] = new corr(0, 1, 0, 0, -668.146);
corrMoon[i++] = new corr(0, 1, 0, -2, -165.145);
corrMoon[i++] = new corr(0, 1, 0, -4, -1.877);
corrMoon[i++] = new corr(0, 0, 0, 3, 0.403);
corrMoon[i++] = new corr(0, 0, 0, 1, -125.154);
corrMoon[i++] = new corr(2, 0, 0, 4, 0.213);
corrMoon[i++] = new corr(2, 0, 0, 2, 14.387);
corrMoon[i++] = new corr(2, 0, 0, 0, 769.016);
corrMoon[i++] = new corr(2, 0, 0, -2, -211.656);
corrMoon[i++] = new corr(2, 0, 0, -4, -30.773);
corrMoon[i++] = new corr(2, 0, 0, -6, -0.570);
corrMoon[i++] = new corr(1, 1, 0, 2, -2.921);
corrMoon[i++] = new corr(1, 1, 0, 0, -109.673);
corrMoon[i++] = new corr(1, 1, 0, -2, -205.962);
corrMoon[i++] = new corr(1, 1, 0, -4, -4.391);
corrMoon[i++] = new corr(1, -1, 0, 4, 0.283);
corrMoon[i++] = new corr(1, -1, 0, 2, 14.577);
corrMoon[i++] = new corr(1, -1, 0, 0, 147.687);
corrMoon[i++] = new corr(1, -1, 0, -2, 28.475);
corrMoon[i++] = new corr(1, -1, 0, -4, 0.636);
corrMoon[i++] = new corr(0, 2, 0, 2, -0.189);
corrMoon[i++] = new corr(0, 2, 0, 0, -7.486);
corrMoon[i++] = new corr(0, 2, 0, -2, -8.096);
corrMoon[i++] = new corr(0, 0, 2, 2, -5.741);
corrMoon[i++] = new corr(0, 0, 2, 0, -411.608);
corrMoon[i++] = new corr(0, 0, 2, -2, -55.173);
corrMoon[i++] = new corr(0, 0, 2, -4, 0.025);
corrMoon[i++] = new corr(1, 0, 0, 1, -8.466);
corrMoon[i++] = new corr(1, 0, 0, -1, 18.609);
corrMoon[i++] = new corr(1, 0, 0, -3, 3.215);
corrMoon[i++] = new corr(0, 1, 0, 1, 18.023);
corrMoon[i++] = new corr(0, 1, 0, -1, 0.560);
corrMoon[i++] = new corr(3, 0, 0, 2, 1.060);
corrMoon[i++] = new corr(3, 0, 0, 0, 36.124);
corrMoon[i++] = new corr(3, 0, 0, -2, -13.193);
corrMoon[i++] = new corr(3, 0, 0, -4, -1.187);
corrMoon[i++] = new corr(3, 0, 0, -6, -0.293);
corrMoon[i++] = new corr(2, 1, 0, 2, -0.290);
corrMoon[i++] = new corr(2, 1, 0, 0, -7.649);
corrMoon[i++] = new corr(2, 1, 0, -2, -8.627);
corrMoon[i++] = new corr(2, 1, 0, -4, -2.740);
corrMoon[i++] = new corr(2, -1, 0, 2, 1.181);
corrMoon[i++] = new corr(2, -1, 0, 0, 9.703);
corrMoon[i++] = new corr(2, -1, 0, -2, -2.494);
corrMoon[i++] = new corr(2, -1, 0, -4, 0.360);
corrMoon[i++] = new corr(1, 2, 0, 0, -1.167);
corrMoon[i++] = new corr(1, 2, 0, -2, -7.412);
corrMoon[i++] = new corr(1, 2, 0, -4, -0.311);
corrMoon[i++] = new corr(1, -2, 0, 2, 0.757);
corrMoon[i++] = new corr(1, -2, 0, 0, 2.580);

corrMoon[i++] = new corr(1, -2, 0, -2, 2.533);
corrMoon[i++] = new corr(0, 3, 0, -2, -0.344);
corrMoon[i++] = new corr(1, 0, 2, 2, -0.992);
corrMoon[i++] = new corr(1, 0, 2, 0, -45.099);
corrMoon[i++] = new corr(1, 0, 2, -2, -0.179);
corrMoon[i++] = new corr(1, 0, -2, 2, -6.382);
corrMoon[i++] = new corr(1, 0, -2, 0, 39.528);
corrMoon[i++] = new corr(1, 0, -2, -2, 9.366);
corrMoon[i++] = new corr(0, 1, 2, 0, 0.415);
corrMoon[i++] = new corr(0, 1, 2, -2, -2.152);
corrMoon[i++] = new corr(0, 1, -2, 2, -1.440);
corrMoon[i++] = new corr(0, 1, -2, -2, 0.384);
corrMoon[i++] = new corr(2, 0, 0, 1, -0.586);
corrMoon[i++] = new corr(2, 0, 0, -1, 1.750);
corrMoon[i++] = new corr(2, 0, 0, -3, 1.225);
corrMoon[i++] = new corr(1, 1, 0, 1, 1.267);
corrMoon[i++] = new corr(1, -1, 0, -1, -1.089);
corrMoon[i++] = new corr(0, 0, 2, -1, 0.584);
corrMoon[i++] = new corr(4, 0, 0, 0, 1.938);
corrMoon[i++] = new corr(4, 0, 0, -2, -0.952);
corrMoon[i++] = new corr(3, 1, 0, 0, -0.551);
corrMoon[i++] = new corr(3, 1, 0, -2, -0.482);
corrMoon[i++] = new corr(3, -1, 0, 0, 0.681);
corrMoon[i++] = new corr(2, 0, 2, 0, -3.996);
corrMoon[i++] = new corr(2, 0, 2, -2, 0.557);
corrMoon[i++] = new corr(2, 0, -2, 2, -0.459);
corrMoon[i++] = new corr(2, 0, -2, 0, -1.298);
corrMoon[i++] = new corr(2, 0, -2, -2, 0.538);
corrMoon[i++] = new corr(1, 1, -2, -2, 0.426);
corrMoon[i++] = new corr(1, -1, 2, 0, -0.304);
corrMoon[i++] = new corr(1, -1, -2, 2, -0.372);
corrMoon[i++] = new corr(0, 0, 4, 0, 0.418);
corrMoon[i++] = new corr(2, -1, 0, -1, -0.352);


var corrMoon2 = new Array(); // additional
i = 0;
// l, ml, ms, f, d
corrMoon2[i++] = new corr2(0.127, 0, 0, 0, 6);
corrMoon2[i++] = new corr2(-0.151, 0, 2, 0, -4);
corrMoon2[i++] = new corr2(-0.085, 0, 0, 2, 4);
corrMoon2[i++] = new corr2(0.150, 0, 1, 0, 3);
corrMoon2[i++] = new corr2(-0.091, 2, 1, 0, -6);
corrMoon2[i++] = new corr2(-0.103, 0, 3, 0, 0);
corrMoon2[i++] = new corr2(-0.301, 1, 0, 2, -4);
corrMoon2[i++] = new corr2(0.202, 1, 0, -2, -4);
corrMoon2[i++] = new corr2(0.137, 1, 1, 0, -1);
corrMoon2[i++] = new corr2(0.233, 1, 1, 0, -3);
corrMoon2[i++] = new corr2(-0.122, 1, -1, 0, 1);
corrMoon2[i++] = new corr2(-0.276, 1, -1, 0, -3);
corrMoon2[i++] = new corr2(0.255, 0, 0, 2, 1);
corrMoon2[i++] = new corr2(0.254, 0, 0, 2, -3);
corrMoon2[i++] = new corr2(-0.100, 3, 1, 0, -4);
corrMoon2[i++] = new corr2(-0.183, 3, -1, 0, -2);
corrMoon2[i++] = new corr2(-0.297, 2, 2, 0, -2);
corrMoon2[i++] = new corr2(-0.161, 2, 2, 0, -4);
corrMoon2[i++] = new corr2(0.197, 2, -2, 0, 0);
corrMoon2[i++] = new corr2(0.254, 2, -2, 0, -2);
corrMoon2[i++] = new corr2(-0.250, 1, 3, 0, -2);
corrMoon2[i++] = new corr2(-0.123, 2, 0, 2, 2);
corrMoon2[i++] = new corr2(0.173, 2, 0, -2, -4);
corrMoon2[i++] = new corr2(0.263, 1, 1, 2, 0);
corrMoon2[i++] = new corr2(0.130, 3, 0, 0, -1);
corrMoon2[i++] = new corr2(0.113, 5, 0, 0, 0);
corrMoon2[i++] = new corr2(0.092, 3, 0, 2, -2);


//-----------------------------------------------------------------------------------
// Calculating geotsent p avoid longitude Moon and angular sector p News.
// (2 sec accuracy. longitude)
//-----------------------------------------------------------------------------------
function moon(jd) {
    var tdays, t, t2, t3, ob, l, d, pe, ms, ml, om, f, d;
    // days from 1900
    tdays = jd - 2415020;
    t = tdays / 36525;
    t2 = t * t;
    t3 = t * t * t;

    // slope travels to the equator
    ob = 23.452294 - 0.0130125 * t - 0.00000164 * t2 + 0.000000503 * t3;
    // the average length moon
    l = 270.4337361 + 13.176396544528099 * tdays - 5.86 * t2 / 3600 + 0.0068 * t3 / 3600;
    // the difference medium length Moon and the Sun (the averageElongation Moon):
    d = 350.7374861110581 + 445267.1142166667 * t - t2 * 1.436111132303874e-3 + 0.0000018888889 * t3;
    // Perigee moon
    pe = 334.329556 + 14648522.52 * t / 3600 - 37.17 * t2 / 3600 - 0.045 * t3 / 3600;
    // the average anomoly sun
    ms = 358.4758333333334 + 35999.04974999958 * t - t2 * 1.500000059604645e-4 - t3 * 3.3333333623078e-6;
    // The average anomoloy moon
    //ml = 296.1046083333757 + 477198.8491083336*t + 0.0091916667090522*t2 + 0.0000143888893*t3;
    ml = fix360(l - pe);
    // Rising length node orbit the moon:
    om = 259.183275 - 6962911.23 * t / 3600 + 7.48 * t2 / 3600 + 0.008 * t3 / 3600;
    // the average length Moon, measured from the bottom up hub orbit:

    f = fix360(l - om);

    var r2rad, tb, t2c, a1, a2, a3, a4, a5, a6, a7, a8, a9, c2, c4, dlm, dpm, dkm, dls, dgc;
    // periodic revisions
    r2rad = 360.0 * Math.PI / 180;
    tb = tdays * 1e-12; // *10^12
    t2c = tdays * tdays * 1e-16; // *10^16
    a1 = Math.sin(r2rad * (0.53733431 - 10104982 * tb + 191 * t2c));
    a2 = Math.sin(r2rad * (0.71995354 - 147094228 * tb + 43 * t2c));
    c2 = Math.cos(r2rad * (0.71995354 - 147094228 * tb + 43 * t2c));
    a3 = Math.sin(r2rad * (0.14222222 + 1536238 * tb));
    a4 = Math.sin(r2rad * (0.48398132 - 147269147 * tb + 43 * t2c));
    c4 = Math.cos(r2rad * (0.48398132 - 147269147 * tb + 43 * t2c));
    a5 = Math.sin(r2rad * (0.52453688 - 147162675 * tb + 43 * t2c));
    a6 = Math.sin(r2rad * (0.84536324 - 11459387 * tb));
    a7 = Math.sin(r2rad * (0.23363774 + 1232723 * tb + 191 * t2c));
    a8 = Math.sin(r2rad * (0.58750000 + 9050118 * tb));
    a9 = Math.sin(r2rad * (0.61043085 - 67718733 * tb));

    dlm = 0.84 * a3 + 0.31 * a7 + 14.27 * a1 + 7.261 * a2 + 0.282 * a4 + 0.237 * a6;
    dpm = -2.1 * a3 - 2.076 * a2 - 0.840 * a4 - 0.593 * a6;
    dkm = 0.63 * a3 + 95.96 * a2 + 15.58 * a4 + 1.86 * a5;
    dls = -6.4 * a3 - 0.27 * a8 - 1.89 * a6 + 0.20 * a9;
    dgc = (-4.318 * c2 - 0.698 * c4) / 3600.0 / 360.0;
    dgc = (1.000002708 + 139.978 * dgc);

    ml = (ml + (dlm - dpm) / 3600.0) * Math.PI / 180; //Average anomoly moon
    ms = (ms + dls / 3600.0) * Math.PI / 180; //Average anomoly sun
    f = (f + (dlm - dkm) / 3600.0) * Math.PI / 180;
    d = (d + (dlm - dls) / 3600.0) * Math.PI / 180; //avg elongation moon
    var lk, lk1, sk, sinp, nip, g1c, i1corr, i2corr, arg, sinarg, dlid, vl, nib;
    lk = 0;
    lk1 = 0;
    sk = 0;
    sinp = 0;
    nib = 0;
    g1c = 0;
    i1corr = 1.0 - 6.8320e-8 * tdays;
    i2corr = dgc * dgc;

    for (i = 0; i < 93; i++) { // outrage at length
        arg = corrMoon[i].mlcor * ml + corrMoon[i].mscor * ms + corrMoon[i].fcor * f + corrMoon[i].dcor * d;
        sinarg = Math.sin(arg);
        if (corrMoon[i].mscor != 0) {
            sinarg *= i1corr;
            if (corrMoon[i].mscor == 2 || corrMoon[i].mscor == -2) sinarg *= i1corr;
        }
        if (corrMoon[i].fcor != 0) sinarg *= i2corr;
        lk += corrMoon[i].lcor * sinarg;
    }
    for (i = 0; i < 27; i++) { // outrage at length additional
        arg = corrMoon2[i].ml * ml + corrMoon2[i].ms * ms + corrMoon2[i].f * f + corrMoon2[i].d * d;
        sinarg = Math.sin(arg);
        lk1 += corrMoon2[i].l * sinarg;
    }

    // resentments of the planets
    dlid = 0.822 * Math.sin(r2rad * (0.32480 - 0.0017125594 * tdays));
    dlid += 0.307 * Math.sin(r2rad * (0.14905 - 0.0034251187 * tdays));
    dlid += 0.348 * Math.sin(r2rad * (0.68266 - 0.0006873156 * tdays));
    dlid += 0.662 * Math.sin(r2rad * (0.65162 + 0.0365724168 * tdays));
    dlid += 0.643 * Math.sin(r2rad * (0.88098 - 0.0025069941 * tdays));
    dlid += 1.137 * Math.sin(r2rad * (0.85823 + 0.0364487270 * tdays));
    dlid += 0.436 * Math.sin(r2rad * (0.71892 + 0.0362179180 * tdays));
    dlid += 0.327 * Math.sin(r2rad * (0.97639 + 0.0001734910 * tdays));

    l = l + nutation(jd) + (dlm + lk + lk1 + dlid) / 3600.0;
    LmoonYoga = l;
    //alert("Lmoon="+l);
    l = fix360(l);

    // angular velocity of the moon on ecliptic (deg/day):
    vl = 13.176397;
    vl = vl + 1.434006 * Math.cos(ml);
    vl = vl + .280135 * Math.cos(2 * d);
    vl = vl + .251632 * Math.cos(2 * d - ml);
    vl = vl + .09742 * Math.cos(2 * ml);
    vl = vl - .052799 * Math.cos(2 * f);
    vl = vl + .034848 * Math.cos(2 * d + ml);
    vl = vl + .018732 * Math.cos(2 * d - ms);
    vl = vl + .010316 * Math.cos(2 * d - ms - ml);
    vl = vl + .008649 * Math.cos(ms - ml);
    vl = vl - .008642 * Math.cos(2 * f + ml);
    vl = vl - .007471 * Math.cos(ms + ml);
    vl = vl - .007387 * Math.cos(d);
    vl = vl + .006864 * Math.cos(3 * ml);
    vl = vl + .00665 * Math.cos(4 * d - ml);
    vl = vl + .003523 * Math.cos(2 * d + 2 * ml);
    vl = vl + .003377 * Math.cos(4 * d - 2 * ml);
    vl = vl + .003287 * Math.cos(4 * d);
    vl = vl - .003193 * Math.cos(ms);
    vl = vl - .003003 * Math.cos(2 * d + ms);
    vl = vl + .002577 * Math.cos(ml - ms + 2 * d);
    vl = vl - .002567 * Math.cos(2 * f - ml);
    vl = vl - .001794 * Math.cos(2 * d - 2 * ml);
    vl = vl - .001716 * Math.cos(ml - 2 * f - 2 * d);
    vl = vl - .001698 * Math.cos(2 * d + ms - ml);
    vl = vl - .001415 * Math.cos(2 * d + 2 * f);
    vl = vl + .001183 * Math.cos(2 * ml - ms);
    vl = vl + .00115 * Math.cos(d + ms);
    vl = vl - .001035 * Math.cos(d + ml);
    vl = vl - .001019 * Math.cos(2 * f + 2 * ml);
    vl = vl - .001006 * Math.cos(ms + 2 * ml);

    skor = vl;
    //l += ay;
    //imoon.f(l < 0.0)l += 360.0;
    return l;
}

function calcayan(jd) {
    var t, om, ls, aya;
    t = (jd - 2415020) / 36525;
    // avg node len moon
    om = 259.183275 - 1934.142008333206 * t + 0.0020777778 * t * t + 0.0000022222222 * t * t * t;
    // avg len sun
    ls = 279.696678 + 36000.76892 * t + 0.0003025 * t * t;
    aya = 17.23 * Math.sin(om * Math.PI / 180) + 1.27 * Math.sin(Math.PI / 180 * ls * 2) - (5025.64 + 1.11 * t) * t;
    aya = (aya - 80861.27) / 3600.0; // 84038.27 = Fagan-Bradley, 80861.27 = Lahiri

    return aya;
}

function lon2dms(x) {

    var r, d, m, s, ss0, str;
    x += 360;
    d = parseInt(x%30);
    m = parseInt((x*60)%60);
    s = parseInt((x*36000)%60);
    r = parseInt((x%360)/30);

    str = zodiachi[r]+" "+d + "º" + m + "'" + s + "\"";

    return str;
}

function nakshatra_end(jd, n_naksh, ayanamsa) {
    if (panchang.nakshtra.end > jd) {
        return panchang.nakshtra.end;
    } else {
        var flag,
            jdt, n1, Lmoon0, asp1;
        jdt = jd;
        flag = 0;
        n1 = fix360((n_naksh + 1) * 80 / 6);
        while (flag < 1) {
            Lmoon0 = fix360(moon(jdt) + ayanamsa);
            asp1 = n1 - Lmoon0; // distance frm moon before nakshatra(degree)
            if (asp1 > 180) asp1 -= 360;
            if (asp1 < -180) asp1 += 360;
            flag = 1;
            if (Math.abs(asp1) > 0.001) {
                jdt += (asp1 / skor);
                flag = 0;
            }
        }
        panchang.nakshtra.end = jdt;
    }
    return panchang.nakshtra.end;
}

function tithi_end(jd, n1, len) {
    if (panchang.tithi.end > jd) {
        return panchang.tithi.end;
    } else {
        var flag = 0,
            jdt, knv, itit, aspect, Lsun0, Lmoon0, a, asp1;
        jdt = jd;
        knv = Math.floor(((jd - 2415020) / 365.25) * 12.3685);
        itit = n1 + 1;
        aspect = len * itit; // sun n moon in the early tithi
        //global.log('aspect'+aspect);
        /*
        if (aspect == 0) {
            jdt = novolun(jd, knv);
            flag = 1;
        }
        if (aspect == 360) {
            jdt = novolun(jd, (knv + 1));
            global.log('jdt-jd when aspect 360:'+(jdt-jd)+' and knv '+knv);
            flag = 1;
        } */
        while (flag < 1) {
            Lsun0 = sun(jdt);
            Lmoon0 = moon(jdt);
            a = fix360(Lsun0 + aspect); // pt should be where luna
            asp1 = a - Lmoon0; // assymptots of the moon to ur point
            if (asp1 > 180) asp1 -= 360;
            if (asp1 < -180) asp1 += 360;
            flag = 1;

            if (Math.abs(asp1) > 0.001) {
                jdt += (asp1 / (skor - 1));
                flag = 0;
            }
        }
        panchang.tithi.end = jdt;
    }

    return panchang.tithi.end;
}

function n_karana(Lmoon, Lsun, jd) {
    nk = (Lmoon - Lsun) / 6;
    if (nk < 0) nk += 60;

    if (nk == 0) n_kar = 10;
    if (nk >= 57) n_kar = nk - 50;
    if (nk > 0 && nk < 57) n_kar = (nk - 1) - (Math.floor((nk - 1) / 7)) * 7;
    return Math.floor(n_kar);
}

//-----------------------------------------------------------------------------
//cal time in the near past novoluna (err less then 2 min)
//-----------------------------------------------------------------------------
function novolun (jd, knv)
{
var t, t2, t3, jdnv, knv, m, ml, f, djd, d2r=Math.PI/180;
t = (jd - 2415020) / 36525;
t2 =t*t;
t3 = t*t*t;
//global.log('novolun start');
//global.log('value of t is '+t);
jdnv = 2415020.75933 + 29.53058868 * knv + 0.0001178 * t2 - 0.000000155 * t3;
jdnv += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * d2r);
m = 359.2242 + 29.10535608 * knv - 0.0000333 * t2 - 0.00000347 * t3;
ml = 306.0253 + 385.81691806 * knv + 0.0107306 * t2 + 0.00001236 * t3;
f = 21.2964 + 390.67050646 * knv - 0.0016528 * t2 - 0.00000239 * t3;
m *= d2r;
ml *= d2r;
f *= d2r;
//global.log('jdnv = '+jdnv+' m='+m+' ml='+ml+' f='+f);
djd = (0.1734 - 0.000393 * t) * Math.sin(m);
djd += 0.0021 * Math.sin(2 * m);
djd -= 0.4068 * Math.sin(ml);
djd += 0.0161 * Math.sin(2 * ml);
djd -= 0.0004 * Math.sin(3 * ml);
djd += 0.0104 * Math.sin(2 * f);
djd -= 0.0051 * Math.sin(m + ml);
djd -= 0.0074 * Math.sin(m - ml);
djd += 0.0004 * Math.sin(2 * f + m);
djd -= 0.0004 * Math.sin(2 * f - m);
djd -= 0.0006 * Math.sin(2 * f + ml);
djd += 0.001 * Math.sin(2 * f - ml);
djd += 0.0005 * Math.sin(m + 2 * ml);

jdnv += djd;

return jdnv;
}
