const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Cairo = imports.gi.cairo;
const Clutter = imports.gi.Clutter;
const ByteArray = imports.byteArray;

function BatteryloadDesklet(metadata, deskletId) {
    this._init(metadata, deskletId);
}

BatteryloadDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);
        
        this.isDestroyed = false;
        this.displayCapacity = 0;
        this.targetCapacity = 0;

        this.container = new St.Widget({ 
            layout_manager: new Clutter.BinLayout(),
            x_expand: true, y_expand: true 
        });
        
        this.canvas = new St.DrawingArea();
        this.canvas.connect('repaint', Lang.bind(this, this._onRepaint));
        this.container.add_actor(this.canvas);

        // Updated layout: Single label with newline support for cleaner formatting
        this.textBin = new St.BoxLayout({ vertical: true, x_align: Clutter.ActorAlign.CENTER, y_align: Clutter.ActorAlign.CENTER });
        this.infoLabel = new St.Label();
        this.textBin.add_actor(this.infoLabel);
        this.container.add_actor(this.textBin);
        
        this.setContent(this.container);

        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, deskletId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scaleSize", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "font-color", "fontColor", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "circle-color", "circleColor", this.onSettingChanged, null);

        this.basePath = "/sys/class/power_supply/BAT0/";
        this.onSettingChanged();
        this._updateLoop();
        this._animateLoop();
    },

    _safeReadFile: function(filename) {
        try {
            let path = this.basePath + filename;
            if (GLib.file_test(path, GLib.FileTest.EXISTS)) {
                let [success, content] = GLib.file_get_contents(path);
                if (success) return ByteArray.toString(content).trim();
            }
        } catch (e) { }
        return null;
    },

    _updateLoop: function() {
        if (this.isDestroyed) return;

        let cNow = this._safeReadFile("charge_now");
        let cFull = this._safeReadFile("charge_full");
        let vNow = this._safeReadFile("voltage_now");
        let iNow = this._safeReadFile("current_now");
        this.status = this._safeReadFile("status") || "Unknown";

        let mAhNow = cNow ? (parseInt(cNow) / 1000).toFixed(0) : 0;
        let mAhFull = cFull ? (parseInt(cFull) / 1000).toFixed(0) : 0;
        let Volts = vNow ? (parseInt(vNow) / 1000000).toFixed(2) : 0;
        let Amps = iNow ? (Math.abs(parseInt(iNow)) / 1000000).toFixed(2) : 0;
        let Watts = (Volts * Amps).toFixed(1);

        let timeStr = "N/A";
        let timeVal = this._safeReadFile(this.status === "Charging" ? "time_to_full_now" : "time_to_empty_now");
        if (timeVal) timeStr = (parseInt(timeVal) / 60).toFixed(0) + "m";

        if (cNow && cFull) this.targetCapacity = (parseInt(cNow) / parseInt(cFull)) * 100;

        let icon = (this.status === "Charging" || this.status === "Full") ? "⚡" : "";
        
        // Formatted raw data lines
        let display = `${this.status}\n${timeStr}\n🔋 ${Math.round(this.targetCapacity)}% ${icon}\n${mAhNow} mAh Now\n${mAhFull} mAh Full\n${Volts} V\n${Amps} A\n${Watts} W`;
        this.infoLabel.set_text(display);

        this.timeout = Mainloop.timeout_add_seconds(2, Lang.bind(this, this._updateLoop));
    },

    _onRepaint: function(area) {
        let cr = area.get_context();
        let [width, height] = area.get_surface_size();
        let center = width / 2;
        let radius = (Math.min(width, height) * 0.4);
        let strokeWidth = 8 * this.scaleSize;

        cr.setSourceRGBA(1, 1, 1, 0.1);
        cr.setLineWidth(strokeWidth);
        cr.arc(center, center, radius, 0, 2 * Math.PI);
        cr.stroke();

        let m = this.circleColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        let col = m ? {r: m[1]/255, g: m[2]/255, b: m[3]/255} : {r: 0, g: 1, b: 0};
        cr.setSourceRGBA(col.r, col.g, col.b, 1);
        cr.setLineWidth(strokeWidth);
        cr.setLineCap(Cairo.LineCap.ROUND);
        let angle = (-Math.PI / 2) + (this.displayCapacity / 100) * (Math.PI * 2);
        cr.arc(center, center, radius, -Math.PI / 2, angle);
        cr.stroke();
        cr.$dispose();
    },

    _animateLoop: function() {
        if (this.isDestroyed) return;
        this.displayCapacity += (this.targetCapacity - this.displayCapacity) * 0.1;
        this.canvas.queue_repaint();
        Mainloop.timeout_add(35, Lang.bind(this, this._animateLoop));
    },

    onSettingChanged: function() {
        let size = 260 * this.scaleSize; // थोड़ा और बड़ा कैनवास
        this.canvas.set_size(size, size);
        // टेक्स्ट साइज बढ़ाया (14px)
        this.infoLabel.set_style(`font-size: ${Math.floor(14 * this.scaleSize)}px; color: ${this.fontColor}; font-weight: bold; text-align: center; line-height: 1.4;`);
    },

    on_desklet_removed: function() {
        this.isDestroyed = true;
    }
};

function main(metadata, deskletId) {
    return new BatteryloadDesklet(metadata, deskletId);
}
