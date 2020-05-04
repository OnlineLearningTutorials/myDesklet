
// Panchang Cinnamon Desklet  16 January 2020
//
// This is a simple desklet to display tithi, nakastram, time and date. 

const Gio = imports.gi.Gio;
const St = imports.gi.St;

const Desklet = imports.ui.desklet;

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const GLib = imports.gi.GLib;
const PopupMenu = imports.ui.popupMenu;
const Util = imports.misc.util;

const Gettext = imports.gettext;
const UUID = "panchang@india";

// l10n/translation support

Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale")

function _(str) {
  return Gettext.dgettext(UUID, str);
}



const allTithis =["अमावस्या","प्रतिपदा","द्वितीया","तृतीया","चतुर्थी","पञ्चमी",
                "षष्ठी", "सप्तमी","अष्टमी","नवमी","दशमी","एकादशी","द्वादशी",
                "त्रयोदशी","चतुर्दशी","पूर्णिमा","प्रतिपदा","द्वितीया","तृतीया",
                "चतुर्थी","पञ्चमी","षष्ठी","सप्तमी","अष्टमी","नवमी",
                "दशमी","एकादशी","द्वादशी","त्रयोदशी","चतुर्दशी"];

const allNakshatrams =["अश्विनी","भरणी","कृत्तिका","रोहिणी","मृगशीर्ष","आर्द्रा",
                      "पुनर्वसु","पुष्य","आश्लेषा","मघा","पूर्व फाल्गुनी ","उत्तराफाल्गुनी","हस्त","चित्रा",
                      "स्वाति","विशाखा","अनुराधा","ज्येष्ठा","मूल","पूर्वाषाढा","उत्तराषाढा",
                      "श्रवण","धनिष्ठा","शतभिषक्","पूर्वभाद्रपदा","उत्तरभाद्रपदा","रेवती"];

const allPakshams = ["शुक्ल पक्ष ", "कृष्ण पक्ष "]

const allVasara = ['रिव', 'सोम', 'मंगल','बुध', 'गुरू', 'शुक्र', 'शिन'];

var PI   = Math.PI,
    sin  = Math.sin,
    cos  = Math.cos,
    tan  = Math.tan,
    asin = Math.asin,
    atan = Math.atan2,
    acos = Math.acos,
    rad  = PI / 180,
    e = rad * 23.4397;


function toDays(date)   { return date.valueOf() / (1000 * 60 * 60 * 24) - 10956.5; }
function radToDeg(rad)  { return ((rad*360/(2*Math.PI) + 360)%360) }
function rightAscension(l, b) { return atan(sin(l) * cos(e) - tan(b) * sin(e), cos(l)); }
function declination(l, b)    { return asin(sin(b) * cos(e) + cos(b) * sin(e) * sin(l)); }
function moonCoords(d) { // geocentric ecliptic coordinates of the moon

    var L = rad * (218.316 + 13.176396 * d), // ecliptic longitude
        M = rad * (134.963 + 13.064993 * d), // mean anomaly
        F = rad * (93.272 + 13.229350 * d),  // mean distance

        l  = L + rad * 6.289 * sin(M), // longitude
        b  = rad * 5.128 * sin(F),     // latitude
        dt = 385001 - 20905 * cos(M);  // distance to the moon in km

       //console.log('L: '+L+', M: '+M+', F: '+F);
       //console.log('l: '+l+', b: '+b+', dt: '+dt);

    return {
        ra: rightAscension(l, b),
        dec: declination(l, b),
        dist: dt
    };
}
function solarMeanAnomaly(d) { return rad * (357.5291 + 0.98560028 * d); }
function eclipticLongitude(M) {

    var C = rad * (1.9148 * sin(M) + 0.02 * sin(2 * M) + 0.0003 * sin(3 * M)), // equation of center
        P = rad * 102.9372; // perihelion of the Earth

    return M + C + P + PI;
}
function sunCoords(d) {

    var M = solarMeanAnomaly(d),
        L = eclipticLongitude(M);
    // console.log('solarMeanAnomaly: '+M+', eclipticLongitude: '+L);
    // console.log('declination: '+declination(L,0)+', rightAscension:'+rightAscension(L,0));
    return {
        dec: declination(L, 0),
        ra: rightAscension(L, 0)
    };
}









function MyDesklet(metadata){
    this._init(metadata);
}

MyDesklet.prototype = {
	__proto__: Desklet.Desklet.prototype,

	_init: function(metadata){
		Desklet.Desklet.prototype._init.call(this, metadata);
		
		this.metadata = metadata
		this.dateFormat = this.metadata["dateFormat"];
		this.dateSize = this.metadata["dateSize"];
		this.timeFormat = this.metadata["timeFormat"];
		this.timeSize = this.metadata["timeSize"];

			
		this._clockContainer = new St.BoxLayout({vertical:true, style_class: 'clock-container'});
		
		this._dateContainer =  new St.BoxLayout({vertical:false, style_class: 'date-container'});
		this._timeContainer =  new St.BoxLayout({vertical:false, style_class: 'time-container'});
		this._tithiContainer = new St.BoxLayout({vertical:false, style_class: 'tithi-container'});
		this._nakashatramContainer = new St.BoxLayout({vertical:false, style_class: 'nakashatram-container'});


		this._date = new St.Label();
		this._time = new St.Label();
		this._tithi = new St.Label();
		this._nakashatram = new St.Label();
		
		
		this._dateContainer.add(this._date);
		this._timeContainer.add(this._time);
		this._tithiContainer.add(this._tithi);
		this._nakashatramContainer.add(this._nakashatram);

		this._clockContainer.add(this._tithiContainer, {x_fill: false, x_align: St.Align.START});
		this._clockContainer.add(this._dateContainer, {x_fill: false, x_align: St.Align.MIDDLE});
		this._clockContainer.add(this._nakashatramContainer, {x_fill: false, x_align: St.Align.END});
		this._clockContainer.add(this._timeContainer, {x_fill: false, x_align: St.Align.MIDDLE});


		this.setContent(this._clockContainer);
		this.setHeader(_("Time And Date"));
		
		// Set the font sizes from .json file
		
		this._date.style="font-size: " + this.dateSize;
		this._time.style="font-size: " + this.timeSize;
		
		// let dir_path = ;
		// this.save_path = dir_path.replace('~', GLib.get_home_dir());
		this.configFile = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/panchang@india/metadata.json";
		this.helpFile = GLib.get_home_dir() + "/.local/share/cinnamon/desklets/panchang@india/README";
		
		global.log("Config file " + this.configFile);
		
		this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

		this._menu.addAction(_("Edit Config"), Lang.bind(this, function() {
			Util.spawnCommandLine("xdg-open " + this.configFile);
		}));
		
		this._menu.addAction(_("Help"), Lang.bind(this, function() {
			Util.spawnCommandLine("xdg-open " + this.helpFile);
		}));
		
		
		this._updateDate();
	},

	on_desklet_removed: function() {
		Mainloop.source_remove(this.timeout);
	},

	_updateDate: function(){

		// let timeFormat = '%H:%M';
		// let dateFormat = '%A,%e %B';
		let displayDate = new Date();
        var d = toDays(displayDate);
        var moonAngle = moonCoords(d);
        var moonAngleD = radToDeg(moonAngle.ra);
        var nakstra = ((Math.floor(moonAngleD*27/360)-3)%27);
        var sunAngle = sunCoords(d);
        var sunAngleD = radToDeg(sunAngle.ra);
        var difAngleD = radToDeg(moonAngle.ra - sunAngle.ra);
        var tithi = ((Math.floor(difAngleD*30/360))%30);
        var paksham = tithi < 15 ? 0 : 1;
        

		this._time.set_text(displayDate.toLocaleFormat(this.timeFormat));
		this._date.set_text(displayDate.toLocaleFormat(this.dateFormat));
		this._tithi.set_text( allPakshams[paksham] + ', ' +  allTithis[tithi] );
		this._nakashatram.set_text(allNakshatrams[nakstra] );
		
		this.timeout = Mainloop.timeout_add_seconds(1, Lang.bind(this, this._updateDate));
		
	}
}

function main(metadata, desklet_id){
	let desklet = new MyDesklet(metadata, desklet_id);
	return desklet;
}

