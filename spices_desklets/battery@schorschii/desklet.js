const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;
const Cairo = imports.gi.cairo;
const GdkPixbuf = imports.gi.GdkPixbuf;
const Cogl = imports.gi.Cogl;
const ByteArray = imports.byteArray;

const UUID = "battery@schorschii";
const DESKLET_ROOT = imports.ui.deskletManager.deskletMeta[UUID].path;

function getImageAtOriginalSize(imageFileName) {
    let pixBuf = GdkPixbuf.Pixbuf.new_from_file(imageFileName);
    let width = pixBuf.get_width();
    let height = pixBuf.get_height();
    let image = new Clutter.Image();
    image.set_data(pixBuf.get_pixels(), pixBuf.get_has_alpha() ? Cogl.PixelFormat.RGBA_8888 : Cogl.PixelFormat.RGBA_888, width, height, pixBuf.get_rowstride());
    let actor = new Clutter.Actor({ width: width, height: height });
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

        this.mainContainer = new St.Bin();
        this.setContent(this.mainContainer);
        this._findBattery();
        this.update();
        this._animateLoop();
    },

    _findBattery: function() {
        let base = "/sys/class/power_supply/BAT0/";
        if (!GLib.file_test(base, GLib.FileTest.EXISTS)) base = "/sys/class/power_supply/BAT1/";
        this.batteryPath = base;
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
            this.currentCapacity = parseInt(this._safeRead("capacity") || 0);
            this.currentState = this._safeRead("status") || "Unknown";
            this.voltageV = (parseInt(this._safeRead("voltage_now") || 0) / 1000000);
            this.currentA = Math.abs(parseInt(this._safeRead("current_now") || 0) / 1000000);
            this.powerWatts = (this.voltageV * this.currentA);
            this.mAhNow = parseInt(this._safeRead("charge_now") || 0) / 1000;
            this.mAhFull = parseInt(this._safeRead("charge_full") || 0) / 1000;
            
            // समय के लिए बेहतर लॉजिक
            let tRaw = this._safeRead((this.currentState === "Charging") ? "time_to_full_now" : "time_to_empty_now");
            if (this.currentState === "Full") this.timeStr = "Full";
            else this.timeStr = tRaw ? (parseInt(tRaw) / 60).toFixed(0) + " min" : "--";
        }
        this.timeout = Mainloop.timeout_add_seconds(2, Lang.bind(this, this.update));
    },

    _animateLoop: function() {
        if (this.displayCapacity === undefined) this.displayCapacity = this.currentCapacity;
        this.displayCapacity += (this.currentCapacity - this.displayCapacity) * 0.08;
        this.refreshDesklet();
        this.animLoop = Mainloop.timeout_add(33, Lang.bind(this, this._animateLoop));
    },
    refreshDesklet: function() {
        this.mainContainer.set_child(null);
        let scale = this.scale_size;
        let mainLayout = new St.BoxLayout({ vertical: true, x_align: Clutter.ActorAlign.CENTER });

        if (this.displaystyle === "plainbattery") {
            let baseScale = scale * 0.6;
            let bgImgName = this.bg_img || "bg_transparent.svg";
            let batteryActor = getImageAtOriginalSize(DESKLET_ROOT + "/img/" + bgImgName);
            batteryActor.set_scale(baseScale, baseScale);

            let barActor = getImageAtOriginalSize(DESKLET_ROOT + "/img/" + (this.currentCapacity <= 20 ? "red.svg" : "green.svg"));
            barActor.set_size(440 * (this.currentCapacity / 100), 235);
            barActor.set_position(36, 15);
            batteryActor.add_actor(barActor);

            let leftCol = new St.BoxLayout({ vertical: true });
            let rightCol = new St.BoxLayout({ vertical: true });

            // फोंट साइज बढ़ाकर 18px किया गया है
            let fontSize = 18 * scale;
            leftCol.add(new St.Label({ text: `${Math.round(this.displayCapacity)}%\n${this.currentState}\n${this.timeStr}`, style: `font-size: ${fontSize}px; color: white; text-align: left; font-weight: bold;` }));
            rightCol.add(new St.Label({ text: `${this.voltageV.toFixed(2)}V\n${(this.currentA * 1000).toFixed(0)}mA\n${this.powerWatts.toFixed(1)}W`, style: `font-size: ${fontSize}px; color: white; text-align: left; font-weight: bold;` }));

            let contentLayout = new St.BoxLayout({ vertical: false, x_align: St.Align.START, y_align: St.Align.START });
            contentLayout.add(leftCol);
            contentLayout.add(new St.Widget({ width: 15 * scale })); // कॉलम के बीच स्पेस
            contentLayout.add(rightCol);

            let stack = new St.Widget({ layout_manager: new Clutter.BinLayout() });
            stack.add_actor(batteryActor);
            
            // पैडिंग कम करके टेक्स्ट को और ऊपर-बाएं शिफ्ट किया गया है
            let textBin = new St.Bin({ 
                width: 440 * baseScale, 
                height: 235 * baseScale,
                x_align: St.Align.START, 
                y_align: St.Align.START,
                style: `padding-top: ${10 * baseScale}px; padding-left: ${25 * baseScale}px;`
            });
            textBin.set_child(contentLayout);
            stack.add_actor(textBin);
            
            mainLayout.add(stack);
        } else {
            // ... (Circle/Speedometer का कोड वैसा ही रहेगा)
            let size = 280 * scale;
            let canvas = new Clutter.Canvas();
            canvas.set_size(size, size);
            canvas.connect('draw', Lang.bind(this, (c, cr, w, h) => { this._drawUI(cr, w, h); }));
            let actor = new Clutter.Actor({ width: size, height: size });
            actor.set_content(canvas);
            canvas.invalidate();

            let dataText = `${Math.round(this.displayCapacity)}%\n${this.currentState}\n${this.timeStr}\n${this.voltageV.toFixed(2)} V\n${(this.currentA * 1000).toFixed(0)} mA\n${this.powerWatts.toFixed(1)} W\n${this.mAhNow.toFixed(0)} / ${this.mAhFull.toFixed(0)} mAh`;
            
            let dataLabel = new St.Label({ 
                text: dataText, 
                style: `font-size: ${14 * scale}px; color: white; font-weight: bold; text-align: center; line-height: 1.2;` 
            });

            let stack = new St.Widget({ layout_manager: new Clutter.BinLayout() });
            stack.add_actor(actor);
            let textBin = new St.Bin({ x_align: St.Align.MIDDLE, y_align: St.Align.MIDDLE });
            textBin.set_child(dataLabel);
            stack.add_actor(textBin);
            mainLayout.add(stack);
        }

        this.mainContainer.set_child(mainLayout);
    },

    _drawUI: function(cr, width, height) {
        cr.save(); cr.setOperator(Cairo.Operator.CLEAR); cr.paint(); cr.restore();
        
        let cx = width / 2;
        let cy = height / 2;
        let radius = width * 0.35;
        let sw = 8 * this.scale_size; // पतली लाइन (Thin stroke)
        
        let color = this.currentCapacity <= 20 ? [1, 0, 0, 1] : [0, 0.7, 1, 1];
        
        // 1. स्पीडोमीटर मोड (नीचे का आर्क)
        if (this.displaystyle === "speedometer") {
            cr.setSourceRGBA(...color);
            cr.setLineWidth(sw);
            cr.setLineCap(Cairo.LineCap.ROUND);
            // आर्क: नीचे की तरफ (bottom) एलाइनमेंट
            cr.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 0.75 + (this.displayCapacity / 100) * Math.PI * 1.5);
            cr.stroke();
        } 
        // 2. सर्कल मोड (पूरा गोला)
        else {
            // बैकग्राउंड (हल्का ग्रे)
            cr.setSourceRGBA(1, 1, 1, 0.1);
            cr.setLineWidth(sw);
            cr.arc(cx, cy, radius, 0, Math.PI * 2);
            cr.stroke();
            
            // प्रोग्रेस रिंग (कलरफुल)
            cr.setSourceRGBA(...color);
            cr.setLineWidth(sw);
            cr.setLineCap(Cairo.LineCap.ROUND);
            cr.arc(cx, cy, radius, -Math.PI/2, (-Math.PI/2) + (this.displayCapacity / 100) * Math.PI * 2);
            cr.stroke();
        }
    },
    on_setting_changed: function() { this.refreshDesklet(); },
    on_desklet_removed: function() { Mainloop.source_remove(this.timeout); Mainloop.source_remove(this.animLoop); }
};

function main(metadata, desklet_id) { return new MyDesklet(metadata, desklet_id); }
