const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Util = imports.misc.util;
const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Clutter = imports.gi.Clutter;
const Cairo = imports.gi.cairo;
const Settings = imports.ui.settings;

const UUID = "temperature@india";

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata);
        
        this.settings = new Settings.DeskletSettings(this, UUID, desklet_id);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scale_size", this.on_setting_changed, null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "update-interval", "update_interval", this.on_setting_changed, null);

        this.sensorsData = []; // Array to store multiple sensors
        this.sensorsPath = null;

        this.mainContainer = new St.BoxLayout({ vertical: true, style_class: "sensor-container" });
        this.setContent(this.mainContainer);

        Util.spawn_async(['which', 'sensors'], (ret) => {
            if (ret && ret.toString().trim() !== "") {
                this.sensorsPath = ret.toString().split('\n', 1)[0].trim();
                this.updateTemperature();
            }
        });
    },

    on_setting_changed: function() {
        this.updateTemperature();
    },

    updateTemperature: function() {
        if (this.sensorsPath) {
            Util.spawn_async([this.sensorsPath], (output) => {
                if (output) {
                    this._parseAllSensors(output.toString());
                }
            });
        }
        
        if (this.timeoutId) Mainloop.source_remove(this.timeoutId);
        this.timeoutId = Mainloop.timeout_add_seconds(this.update_interval || 2, Lang.bind(this, this.updateTemperature));
    },

    _parseAllSensors: function(text) {
        // Regex to find Label and Temperature (e.g., "Core 0: +45.0°C")
        let regex = /([^:\n]+):\s+\+?(\d+\.\d+)°C/g;
        let match;
        let newData = [];

        while ((match = regex.exec(text)) !== null) {
            newData.push({
                label: match[1].trim(),
                temp: parseFloat(match[2])
            });
        }

        this.sensorsData = newData;
        this.refreshUI();
    },

    refreshUI: function() {
        this.mainContainer.destroy_all_children();
        let scale = this.scale_size || 1.0;

        for (let sensor of this.sensorsData) {
            let row = new St.BoxLayout({ vertical: false, style: "margin-bottom: 10px;" });
            
            // 1. Drawing the Canvas Gauge
            let canvas = new Clutter.Canvas();
            canvas.set_size(60 * scale, 60 * scale);
            canvas.connect('draw', (canvas, cr, width, height) => {
                this._drawMiniGauge(cr, width, height, sensor.temp, scale);
            });

            let drawingArea = new Clutter.Actor({ width: 60 * scale, height: 60 * scale });
            drawingArea.set_content(canvas);
            canvas.invalidate();

            // 2. Info Label
            let info = new St.BoxLayout({ vertical: true, style: "margin-left: 10px; justify-content: center;" });
            let nameLabel = new St.Label({ text: sensor.label, style: `font-size: ${10 * scale}px; color: #aaa;` });
            let valLabel = new St.Label({ text: sensor.temp + "°C", style: `font-size: ${14 * scale}px; font-weight: bold; color: white;` });
            
            info.add_actor(nameLabel);
            info.add_actor(valLabel);

            row.add_actor(drawingArea);
            row.add_actor(info);
            this.mainContainer.add_actor(row);
        }
    },

    _drawMiniGauge: function(cr, width, height, temp, scale) {
        cr.save();
        cr.setOperator(Cairo.Operator.CLEAR);
        cr.paint();
        cr.restore();

        let cx = width / 2;
        let cy = height / 2;
        let radius = width * 0.35;
        let start = Math.PI * 0.75;
        let end = Math.PI * 2.25;
        let progress = (Math.min(temp, 100) / 100) * (end - start);

        // Background
        cr.setLineWidth(6 * scale);
        cr.setSourceRGBA(1, 1, 1, 0.1);
        cr.arc(cx, cy, radius, start, end);
        cr.stroke();

        // Dynamic Color Selection
        if (temp < 45) {
            cr.setSourceRGBA(0, 1, 0.5, 1); // Vibrant Green (Cool)
        } else if (temp < 75) {
            cr.setSourceRGBA(1, 0.8, 0, 1); // Vibrant Yellow/Orange (Warm)
        } else {
            cr.setSourceRGBA(1, 0.1, 0.1, 1); // Vibrant Red (Hot)
        }

        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.arc(cx, cy, radius, start, start + progress);
        cr.stroke();
    }
};

function main(metadata, desklet_id) {
    return new MyDesklet(metadata, desklet_id);
}
