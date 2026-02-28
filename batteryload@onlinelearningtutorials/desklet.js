const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Cairo = imports.gi.cairo;
const Gio = imports.gi.Gio;
const ByteArray = imports.byteArray;

function BatteryloadDesklet(metadata, deskletId) {
    this._init(metadata, deskletId);
}

BatteryloadDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);
        
        this.isDestroyed = false;
        this.targetCapacity = 0;
        this.displayCapacity = 0;
        this.powerWatts = 0;
        this.voltageV = 0;
        this.status = "Unknown";
        this.timeStr = "--";
        this.glowStep = 0;

        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, deskletId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "low-threshold", "lowThreshold", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "refresh-interval", "refreshInterval", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "design", "design", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scaleSize", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "circle-color", "circleColor", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "font-color", "fontColor", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "low-battery-color", "lowBatteryColor", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "text-view", "textView", this.onSettingChanged, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "show-background", "showBackground", this.onSettingChanged, null);

        this.canvas = new St.DrawingArea();
        this.canvas.connect('repaint', Lang.bind(this, this._onRepaint));
        this.setContent(this.canvas);

        this._findBatteryPaths();
        this.onSettingChanged();
        
        this._updateLoop();
        this._animateLoop();
    },

    _findBatteryPaths: function() {
        let base = "/sys/class/power_supply/";
        let dirs = ["BAT0", "BAT1", "BATC", "CMB0"];
        this.basePath = "";
        for (let d of dirs) {
            if (GLib.file_test(base + d, GLib.FileTest.EXISTS)) {
                this.basePath = base + d + "/";
                break;
            }
        }
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
        if (this.isDestroyed || !this.basePath) return;

        // 1. Capacity
        let cap = this._safeReadFile("capacity");
        this.targetCapacity = cap ? parseInt(cap) : 0;

        // 2. Status
        this.status = this._safeReadFile("status") || "Unknown";

        // 3. Power & Voltage Logic
        let vStr = this._safeReadFile("voltage_now");
        let iStr = this._safeReadFile("current_now");
        let pStr = this._safeReadFile("power_now");
        
        // Voltage
        this.voltageV = vStr ? (parseInt(vStr) / 1000000) : 0;

        // Watts calculation
        if (pStr) {
            this.powerWatts = Math.abs(parseInt(pStr) / 1000000);
        } else if (vStr && iStr) {
            this.powerWatts = Math.abs((this.voltageV * parseInt(iStr)) / 1000000);
        } else {
            this.powerWatts = 0; // If data missing
        }

        // 4. Time Remaining (Simplified Logic)
        let eNow = this._safeReadFile("energy_now") || this._safeReadFile("charge_now");
        let eFull = this._safeReadFile("energy_full") || this._safeReadFile("charge_full");
        
        if (this.powerWatts > 0 && eNow) {
            let rate = pStr ? parseInt(pStr) : Math.abs(parseInt(iStr));
            if (rate > 0) {
                let remaining = (this.status === "Charging") ? (parseInt(eFull) - parseInt(eNow)) : parseInt(eNow);
                let hours = remaining / rate;
                let h = Math.floor(hours);
                let m = Math.floor((hours - h) * 60);
                this.timeStr = h + "h " + m + "m";
            }
        } else {
            this.timeStr = "--";
        }

        this.timeout = Mainloop.timeout_add_seconds(this.refreshInterval || 2, Lang.bind(this, this._updateLoop));
    },

    _animateLoop: function() {
        if (this.isDestroyed) return;
        
        // Smooth capacity animation
        let diff = this.targetCapacity - this.displayCapacity;
        this.displayCapacity += diff * 0.1;

        // Pulse for charging
        if (this.status === "Charging") {
            this.glowStep += 0.06;
            if (this.glowStep > Math.PI) this.glowStep = 0;
        }

        this.canvas.queue_repaint();
        Mainloop.timeout_add(35, Lang.bind(this, this._animateLoop));
    },

    _onRepaint: function(area) {
        let cr = area.get_context();
        let [width, height] = area.get_surface_size();
        let centerX = width / 2;
        let centerY = height / 2;
        let radius = (Math.min(width, height) * 0.32);
        
        let strokeWidth = (this.design === "thin") ? 4 : (this.design === "compact" ? 8 : 16);
        strokeWidth *= this.scaleSize;

        // 1. Glow (Charging)
        if (this.status === "Charging") {
            cr.setSourceRGBA(0, 1, 0.4, 0.4 * Math.sin(this.glowStep));
            cr.setLineWidth(strokeWidth + 10);
            cr.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            cr.stroke();
        }

        // 2. Background
        if (this.showBackground) {
            cr.setSourceRGBA(1, 1, 1, 0.1);
            cr.setLineWidth(strokeWidth);
            cr.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            cr.stroke();
        }

        // 3. Progress
        let color = this._getParsedColor();
        cr.setSourceRGBA(color.r, color.g, color.b, 1);
        cr.setLineWidth(strokeWidth);
        cr.setLineCap(Cairo.LineCap.ROUND);
        let endAngle = (-Math.PI / 2) + (this.displayCapacity / 100) * (Math.PI * 2);
        cr.arc(centerX, centerY, radius, -Math.PI / 2, endAngle);
        cr.stroke();

        // 4. Text Rendering
        let fontColor = this._hexToRgb(this.fontColor);
        cr.setSourceRGBA(fontColor.r, fontColor.g, fontColor.b, 1);
        cr.selectFontFace("Sans", Cairo.FontSlant.NORMAL, Cairo.FontWeight.BOLD);

        // Percentage
        let fontSize = 28 * this.scaleSize;
        cr.setFontSize(fontSize);
        let pctText = Math.round(this.displayCapacity) + "%";
        let ext = cr.textExtents(pctText);
        cr.moveTo(centerX - (ext.width / 2), centerY + (ext.height / 2.5));
        cr.showText(pctText);

        // Stats (Watts & Volts)
        cr.setFontSize(fontSize * 0.4);
        let stats = this.powerWatts.toFixed(1) + "W | " + this.voltageV.toFixed(1) + "V";
        let sExt = cr.textExtents(stats);
        cr.moveTo(centerX - (sExt.width / 2), centerY + radius + (strokeWidth * 1.5) + 10);
        cr.showText(stats);

        // Top Status (Time or Status)
        let topText = "";
        if (this.textView === "per_status") topText = this.status;
        else if (this.textView === "per_remtime") topText = this.timeStr;

        if (topText !== "") {
            let tExt = cr.textExtents(topText);
            cr.moveTo(centerX - (tExt.width / 2), centerY - radius - (strokeWidth) - 5);
            cr.showText(topText);
        }

        cr.$dispose();
    },

    _getParsedColor: function() {
        let colorStr = (this.targetCapacity <= this.lowThreshold) ? this.lowBatteryColor : this.circleColor;
        return this._hexToRgb(colorStr);
    },

    _hexToRgb: function(rgba) {
        let m = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        return m ? { r: m[1]/255, g: m[2]/255, b: m[3]/255, a: m[4] ? parseFloat(m[4]) : 1 } : { r: 1, g: 1, b: 1, a: 1 };
    },

    onSettingChanged: function() {
        let size = 200 * this.scaleSize;
        this.canvas.set_size(size, size);
    },

    on_desklet_removed: function() {
        this.isDestroyed = true;
    }
};

function main(metadata, deskletId) {
    return new BatteryloadDesklet(metadata, deskletId);
}
