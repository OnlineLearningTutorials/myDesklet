const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;
const Cairo = imports.gi.cairo;
const Gio = imports.gi.Gio;
const ByteArray = imports.byteArray;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Cogl = imports.gi.Cogl;

const UUID = "battery@schorschii";
const DESKLET_ROOT = imports.ui.deskletManager.deskletMeta[UUID].path;

function getImageAtScale(imageFileName, width, height, width2 = 0, height2 = 0) {
    if (width2 == 0 || height2 == 0) { width2 = width; height2 = height; }
    let pixBuf = GdkPixbuf.Pixbuf.new_from_file_at_size(imageFileName, width, height);
    let image = new Clutter.Image();
    image.set_data(pixBuf.get_pixels(), pixBuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888 : Cogl.PixelFormat.RGBA_888, width, height, pixBuf.get_rowstride());
    let actor = new Clutter.Actor({ width: width2, height: height2 });
    actor.set_content(image);
    return actor;
}

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata);
        this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], desklet_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "displaystyle", "displaystyle", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scale_size", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "bg-img", "bg_img", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "showpercent", "showpercent", this.on_setting_changed);

        this.currentCapacity = 0;
        this.displayCapacity = 0;
        this.currentState = "Unknown";
        this.powerWatts = 0;
        this.voltageV = 0;
        this.currentA = 0;
        this.glowStep = 0;

        this.mainContainer = new St.Bin();
        this.setContent(this.mainContainer);

        this._findBattery();
        this.update();
        this._animateLoop();
    },

    _findBattery: function() {
        let base = "/sys/class/power_supply/";
        let dirs = ["BAT0", "BAT1", "BATC", "CMB0"];
        this.batteryPath = "";
        for (let d of dirs) {
            if (GLib.file_test(base + d, GLib.FileTest.EXISTS)) {
                this.batteryPath = base + d + "/"; break;
            }
        }
    },

    _safeRead: function(f) {
        try {
            let p = this.batteryPath + f;
            if (GLib.file_test(p, GLib.FileTest.EXISTS)) {
                let [ok, c] = GLib.file_get_contents(p);
                if (ok) return ByteArray.toString(c).trim();
            }
        } catch (e) {} return null;
    },

    update: function() {
        if (this.batteryPath) {
            let cap = this._safeRead("capacity");
            if (cap) this.currentCapacity = parseInt(cap);
            this.currentState = this._safeRead("status") || "Unknown";
            let vRaw = this._safeRead("voltage_now") || this._safeRead("voltage_avg");
            this.voltageV = vRaw ? (parseInt(vRaw) / 1000000) : 0;
            let pRaw = this._safeRead("power_now");
            let iRaw = this._safeRead("current_now") || this._safeRead("current_avg");
            if (pRaw) {
                this.powerWatts = Math.abs(parseInt(pRaw) / 1000000);
                this.currentA = (this.voltageV > 0) ? (this.powerWatts / this.voltageV) : 0;
            } else if (iRaw) {
                this.currentA = Math.abs(parseInt(iRaw) / 1000000);
                this.powerWatts = this.currentA * this.voltageV;
            }
        }
        this.refreshDesklet();
        this.timeout = Mainloop.timeout_add_seconds(2, Lang.bind(this, this.update));
    },

    _animateLoop: function() {
        let diff = this.currentCapacity - this.displayCapacity;
        this.displayCapacity += diff * 0.08;
        this.glowStep += 0.06;
        if (this.glowStep > Math.PI) this.glowStep = 0;
        if (this.canvas) this.canvas.invalidate();
        this.animLoop = Mainloop.timeout_add(33, Lang.bind(this, this._animateLoop));
    },

    refreshDesklet: function() {
        this.mainContainer.set_child(null);
        let scale = this.scale_size * global.ui_scale;

        if (this.displaystyle === "plainbattery") {
            let bW = 150 * scale; 
            let bH = 74 * scale;
            
            let bgImgName = this.bg_img || "bg_transparent.svg";
            let batteryActor = getImageAtScale(DESKLET_ROOT + "/img/" + bgImgName, bW, bH);

            let barImg = (this.currentCapacity <= 20) ? "red.svg" : "green.svg";
            if (this.currentCapacity === 0) barImg = "none.svg";

            // --- SMALLER BAR CALCULATION ---
            // चौड़ाई को 88.5% से घटाकर 83% किया गया है
            let segMaxW = bW * 0.83; 
            let segH = bH * 0.85; // ऊंचाई को भी थोड़ा कम किया ताकि ऊपर-नीचे जगह रहे
            let segW = segMaxW * (this.currentCapacity / 100);

            let segment = getImageAtScale(DESKLET_ROOT + "/img/" + barImg, Math.round(segMaxW), Math.round(segH), Math.round(segW), Math.round(segH));
            
            // X-Offset को 12.7 से बढ़ाकर 14 किया ताकि बार थोड़ा दाईं ओर सेट हो
            // Y-Offset को 3.1 से बढ़ाकर 5.5 किया ताकि वर्टिकल सेंटरिंग सही रहे
            segment.set_position(Math.round(9 * scale), Math.round(5 * scale));
            batteryActor.add_actor(segment);

            if (this.showpercent) {
                let pctLabel = new St.Label({ text: this.currentCapacity + "%", style: `font-size: ${16 * scale}px; font-weight: bold; color: white; text-align: center; width: ${bW}px;` });
                pctLabel.set_position(0, (bH / 2) - (11 * scale));
                batteryActor.add_actor(pctLabel);
            }

            let statsText = `${this.powerWatts.toFixed(1)}W | ${this.voltageV.toFixed(1)}V | ${this.currentA.toFixed(2)}A`;
            let statsLabel = new St.Label({ text: statsText, style: `font-size: ${10 * scale}px; color: #ffffff; text-align: center; width: ${bW}px; margin-top: 10px;` });

            let layout = new St.BoxLayout({ vertical: true });
            layout.add(batteryActor);
            layout.add(statsLabel);
            this.mainContainer.set_child(layout);
        } else {
            // --- CIRCLE / SPEEDOMETER ---
            let size = 220 * scale;
            this.canvas = new Clutter.Canvas();
            this.canvas.set_size(size, size);
            this.canvas.connect('draw', Lang.bind(this, this._drawUI));
            let actor = new Clutter.Actor({ width: size, height: size });
            actor.set_content(this.canvas);
            this.mainContainer.set_child(actor);
        }
    },

    _drawUI: function(canvas, cr, width, height) {
        cr.save(); cr.setOperator(Cairo.Operator.CLEAR); cr.paint(); cr.restore();
        let cx = width / 2; let cy = height / 2;
        let radius = width * 0.35; let sw = 14 * this.scale_size;

        if (this.displaystyle === "speedometer") {
            let start = Math.PI * 0.8; let end = Math.PI * 2.2;
            let current = start + (this.displayCapacity / 100) * (end - start);
            cr.setSourceRGBA(1, 1, 1, 0.15); cr.setLineWidth(sw); cr.arc(cx, cy, radius, start, end); cr.stroke();
            
            let grad = new Cairo.LinearGradient(0, 0, width, 0);
            grad.addColorStopRGBA(0, 1, 0, 0, 1);
            grad.addColorStopRGBA(0.5, 1, 1, 0, 1);
            grad.addColorStopRGBA(1, 0, 1, 0.2, 1);
            cr.setSource(grad); cr.setLineWidth(sw); cr.setLineCap(Cairo.LineCap.ROUND);
            cr.arc(cx, cy, radius, start, current); cr.stroke();
        } else {
            cr.setSourceRGBA(1, 1, 1, 0.1); cr.setLineWidth(sw); cr.arc(cx, cy, radius, 0, Math.PI * 2); cr.stroke();
            if (this.currentState === "Charging") {
                cr.setSourceRGBA(0, 1, 1, 0.4 * Math.sin(this.glowStep));
                cr.setLineWidth(sw + 10); cr.arc(cx, cy, radius, 0, Math.PI * 2); cr.stroke();
            }
            cr.setSourceRGBA(0, 0.8, 1, 1); cr.setLineWidth(sw); cr.setLineCap(Cairo.LineCap.ROUND);
            cr.arc(cx, cy, radius, -Math.PI/2, (-Math.PI/2) + (this.displayCapacity/100)*Math.PI*2); cr.stroke();
        }

        cr.setSourceRGBA(1, 1, 1, 1); cr.selectFontFace("Sans", 0, 1);
        cr.setFontSize(30 * this.scale_size);
        let pct = Math.round(this.displayCapacity) + "%";
        let pExt = cr.textExtents(pct);
        cr.moveTo(cx - pExt.width/2, cy + pExt.height/3); cr.showText(pct);

        cr.setFontSize(11 * this.scale_size);
        let stats = `${this.powerWatts.toFixed(1)}W | ${this.voltageV.toFixed(1)}V | ${this.currentA.toFixed(2)}A`;
        let sExt = cr.textExtents(stats);
        cr.moveTo(cx - sExt.width/2, cy + radius + sw + 20); cr.showText(stats);
        return true;
    },

    on_setting_changed: function() { this.refreshDesklet(); },
    on_desklet_removed: function() { 
        Mainloop.source_remove(this.timeout); 
        Mainloop.source_remove(this.animLoop); 
    }
};

function main(metadata, desklet_id) { return new MyDesklet(metadata, desklet_id); }
