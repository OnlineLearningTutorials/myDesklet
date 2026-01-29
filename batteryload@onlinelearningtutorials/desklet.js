const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Gio = imports.gi.Gio;
const Util = imports.misc.util;
const Gettext = imports.gettext;
const Main = imports.ui.main;
const ByteArray = imports.byteArray;


const UUID = "batteryload@onlinelearningtutorials";
const DESKLET_ROOT = imports.ui.deskletManager.deskletMeta[UUID].path;

// Translation support
function _(str) {
    return Gettext.dgettext(UUID, str);
}

function BatteryloadDesklet(metadata, deskletId) {
    // Initialize translations
    if (!DESKLET_ROOT.startsWith("/usr/share/")) {
        Gettext.bindtextdomain(UUID, GLib.get_home_dir() + "/.local/share/locale");
    }
    this._init(metadata, deskletId);
}

function main(metadata, deskletId) {
    return new BatteryloadDesklet(metadata, deskletId);
}

BatteryloadDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, deskletId) {
        Desklet.Desklet.prototype._init.call(this, metadata, deskletId);

        // Initialize state
        this.timeout = null;
        this.isDestroyed = false;

        // Bind settings
        this.settings = new Settings.DeskletSettings(this, this.metadata.uuid, deskletId);
        this.settings.bindProperty(Settings.BindingDirection.IN, "type", "type", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "refresh-interval", "refreshInterval", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "design", "design", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scaleSize", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "text-view", "textView", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "font-color", "fontColor", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "use-custom-color", "useCustomColor", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "circle-color", "circleColor", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "show-background", "showBackground", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "hide-decorations", "hideDecorations", this.onSettingChanged);
        this.settings.bindProperty(Settings.BindingDirection.IN, "onclick-action", "onclickAction", this.onSettingChanged);

        // Persistent random color (stored in settings)
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "random-color-r", "randomColorR", null);
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "random-color-g", "randomColorG", null);
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "random-color-b", "randomColorB", null);
        this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "random-color-generated", "randomColorGenerated", null);
        this.settings.bindProperty(Settings.BindingDirection.IN, "devfile_capacity", "devfile_capacity", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "devfile_status", "devfile_status", this.on_setting_changed);

        // Generate random color once and persist it
        if (!this.randomColorGenerated) {
            this.randomColorR = Math.random();
            this.randomColorG = Math.random();
            this.randomColorB = Math.random();
            this.randomColorGenerated = true;
        }

        // Base sizes
        this.baseSize = 150;
        this.baseFontSize = 22;
        this.baseSubFontSize = 13;

        this.setupUI();
    },

    setupUI: function() {
        this.canvas = new Clutter.Actor();
        this.textPercent = new St.Label({style_class: "memload-text"});
        this.textSub1 = new St.Label({style_class: "memload-text"});
        this.textSub2 = new St.Label({style_class: "memload-text"});

        this.canvas.add_actor(this.textPercent);
        this.canvas.add_actor(this.textSub1);
        this.canvas.add_actor(this.textSub2);
        this.setContent(this.canvas);

          // default device files
        let default_devfiles_capacity = ['/sys/class/power_supply/CMB0/capacity',
            '/sys/class/power_supply/CMB1/capacity',
            '/sys/class/power_supply/BAT0/capacity',
            '/sys/class/power_supply/BAT1/capacity',
            '/sys/class/power_supply/BAT2/capacity'
        ];
        let default_devfiles_status = ['/sys/class/power_supply/CMB0/status',
            '/sys/class/power_supply/CMB1/status',
            '/sys/class/power_supply/BAT0/status',
            '/sys/class/power_supply/BAT1/status',
            '/sys/class/power_supply/BAT2/status'
        ];
         // get device files from settings
        // remove "file://" from path
        this.result_devfile_capacity = decodeURIComponent(this.devfile_capacity.replace("file://", ""));
        this.result_devfile_status = decodeURIComponent(this.devfile_status.replace("file://", ""));

        // auto detect device files if settings were not set
        if (this.result_devfile_capacity == "") {
            // iterate trough default devfiles ...
            for (let i in default_devfiles_capacity) {
                // ... and check if it exists
                if (GLib.file_test(default_devfiles_capacity[i], GLib.FileTest.EXISTS) &&
                    (!GLib.file_test(default_devfiles_capacity[i], GLib.FileTest.IS_DIR))) {
                    this.result_devfile_capacity = default_devfiles_capacity[i];
                    break;
                }
            }
        }
        if (this.result_devfile_status == "") {
            // iterate trough default devfiles ...
            for (let i in default_devfiles_status) {
                // ... and check if it exists
                if (GLib.file_test(default_devfiles_status[i], GLib.FileTest.EXISTS) &&
                    (!GLib.file_test(default_devfiles_status[i], GLib.FileTest.IS_DIR))) {
                    this.result_devfile_status = default_devfiles_status[i];
                    break;
                }
            }
        }
        global.logError(UUID + "result_devfile_capacity:  " + this.result_devfile_capacity );
        global.logError(UUID + "result_devfile_status:  " + this.result_devfile_status );
        
        Main.notifyError(this.result_devfile_capacity, this.result_devfile_status); // debug


        this.refreshDecoration();
        this.update();
    },

    update: function() {
        if (this.isDestroyed) return;

        this.refreshMemory();
        this.timeout = Mainloop.timeout_add_seconds(this.refreshInterval, Lang.bind(this, this.update));
    },

    refreshMemory: function() {
        if (this.isDestroyed) return;
        //let currentCapacity = "";
        //let currentState = "";

        // get current battery/power supply values
        
            // read capacity file async
            let file_capacity = Gio.file_new_for_path(this.result_devfile_capacity);
            file_capacity.load_contents_async(null, (file, response) => {
                try {
                    let [success, contents, tag] = file.load_contents_finish(response);
                    if (success) {
                        this.currentCapacity = parseInt(ByteArray.toString(contents));
                        //global.logError(UUID + "currentCapacity: "+this.currentCapacity);
                        // fix for some batteries reporting values higher than 100
                        if (this.currentCapacity > 100) this.currentCapacity = 100;
                    }
                    GLib.free(contents);
                } catch (err) {
                    global.logError(UUID + ": Error reading battery capacity info: " + err.toString());
                }
                //this.refreshDesklet();
            });
            // read status file async
            // let file_status = Gio.file_new_for_path(this.result_devfile_status);
            // file_status.load_contents_async(null, (file, response) => {
            //     try {
            //         let [success, contents, tag] = file.load_contents_finish(response);
            //         if (success) {
            //             this.currentState = ByteArray.toString(contents).trim();
            //             global.logError(UUID + "currentState: "+currentState);
            //         }
            //         GLib.free(contents);
            //     } catch (err) {
            //         global.logError(UUID + ": Error reading battery status info: " + err.toString());
            //     }
            //     //this.refreshDesklet();
            // });
            this.result_devfile_charge_full = '/sys/class/power_supply/BAT0/charge_full';
            let file_charge_full = Gio.file_new_for_path(this.result_devfile_charge_full);
            file_charge_full.load_contents_async(null, (file, response) => {
                try {
                    let [success, contents, tag] = file.load_contents_finish(response);
                    if (success) {
                        this.currentChargeFull = parseInt(ByteArray.toString(contents));
                    }
                    GLib.free(contents);
                } catch (err) {
                    global.logError(UUID + ": Error reading battery charge_full info: " + err.toString());
                }
            });
            this.result_devfile_charge_now = '/sys/class/power_supply/BAT0/charge_now';
            let file_charge_now = Gio.file_new_for_path(this.result_devfile_charge_now);
            file_charge_now.load_contents_async(null, (file, response) => {
                try {
                    let [success, contents, tag] = file.load_contents_finish(response);
                    if (success) {
                        this.currentChargenow = parseInt(ByteArray.toString(contents));
                    }
                    GLib.free(contents);
                } catch (err) {
                    global.logError(UUID + ": Error reading battery charge_now info: " + err.toString());
                }
            });
            
            let total = this.currentChargeFull;
            let percent = this.currentCapacity;
            let free = this.currentChargeFull - this.currentChargenow;
            let used = this.currentChargenow
            
            //used = total - free;
            //let percent = total > 0 ? Math.round(used * 100 / total) : 0;
            //global.logError(UUID + ": battery info: total" + total+" percent"+percent+" free"+free+" used"+used);
            this.redraw(percent, used, free, total);
       
    },

    redraw: function(percent, used, free, total) {
        if (this.isDestroyed) return;

        let size = this.baseSize * this.scaleSize;
        let fontSize = Math.round(this.baseFontSize * this.scaleSize);
        let subFontSize = Math.round(this.baseSubFontSize * this.scaleSize);

        // Get circle color
        let color = this.getCircleColor();

        // Draw the circle
        let canvas = new Clutter.Canvas();
        canvas.set_size(size * global.ui_scale, size * global.ui_scale);
        canvas.connect("draw", Lang.bind(this, function(canvas, cr, width, height) {
            cr.save();
            cr.setOperator(Cairo.Operator.CLEAR);
            cr.paint();
            cr.restore();
            cr.setOperator(Cairo.Operator.OVER);
            cr.scale(width, height);
            cr.translate(0.5, 0.5);

            let offset = Math.PI * 0.5;
            let start = 0 - offset;
            let end = ((percent * Math.PI * 2) / 100) - offset;

            if (this.design === "thin") {
                this.drawThin(cr, start, end, color);
            } else if (this.design === "compact") {
                this.drawCompact(cr, start, end, color);
            } else {
                this.drawThick(cr, start, end, color);
            }

            return true;
        }));
        canvas.invalidate();
        this.canvas.set_content(canvas);
        this.canvas.set_size(size * global.ui_scale, size * global.ui_scale);

        // Update text
        let sub1Text, sub2Text;
        let name = this.type === "swap" ? _("Swap") : _("RAM");

        switch (this.textView) {
            case "free-total":
                sub1Text = parseFloat(free).toString(); // this.formatBytes(free);
                sub2Text = parseFloat(total).toString(); //this.formatBytes(total);
                break;
            case "name-used":
                sub1Text = name;
                sub2Text = this.formatBytes(used);
                break;
            case "name-free":
                sub1Text = name;
                sub2Text = this.formatBytes(free);
                break;
            default: // used-total
                sub1Text = parseFloat(used).toString();
                sub2Text = parseFloat(total).toString();
        }

        let textY = Math.round((size * global.ui_scale) / 2 - fontSize * 1.26 * global.ui_scale);
        this.textPercent.set_position(0, textY);
        this.textPercent.set_text("🔋"+percent + "%🟢🟠⚪🟩🟥🔥💥");
        this.textPercent.style = this.getTextStyle(fontSize, size);

        let sub1Y = Math.round(textY + fontSize * 1.25 * global.ui_scale);
        this.textSub1.set_position(0, sub1Y);
        this.textSub1.set_text(sub1Text);
        this.textSub1.style = this.getTextStyle(subFontSize, size);

        let sub2Y = Math.round(sub1Y + subFontSize * 1.25 * global.ui_scale);
        this.textSub2.set_position(0, sub2Y);
        this.textSub2.set_text(sub2Text);
        this.textSub2.style = this.getTextStyle(subFontSize, size);
    },

    drawThin: function(cr, start, end, color) {
        if (this.showBackground) {
            cr.setSourceRGBA(1, 1, 1, 0.2);
            cr.setLineWidth(0.045);
            cr.arc(0, 0, 0.45, 0, Math.PI * 2);
            cr.stroke();
        }
        cr.setLineCap(Cairo.LineCap.ROUND);
        cr.setSourceRGBA(color.r, color.g, color.b, 1);
        cr.setLineWidth(0.045);
        cr.arc(0, 0, 0.45, start, end);
        cr.stroke();
    },

    drawCompact: function(cr, start, end, color) {
        if (this.showBackground) {
            cr.setSourceRGBA(1, 1, 1, 0.2);
            cr.setLineWidth(0.4);
            cr.arc(0, 0, 0.2, 0, Math.PI * 2);
            cr.stroke();
        }
        cr.setSourceRGBA(color.r, color.g, color.b, 1);
        cr.setLineWidth(0.4);
        cr.arc(0, 0, 0.2, start, end);
        cr.stroke();
    },

    drawThick: function(cr, start, end, color) {
        if (this.showBackground) {
            cr.setSourceRGBA(1, 1, 1, 0.2);
            cr.setLineWidth(0.19);
            cr.arc(0, 0, 0.4, 0, Math.PI * 2);
            cr.stroke();
        }
        cr.setSourceRGBA(color.r, color.g, color.b, 1);
        cr.setLineWidth(0.19);
        cr.arc(0, 0, 0.4, start, end);
        cr.stroke();
        cr.setSourceRGBA(0, 0, 0, 0.1446);
        cr.setLineWidth(0.048);
        cr.arc(0, 0, 0.329, start, end);
        cr.stroke();
    },

    getCircleColor: function() {
        if (this.useCustomColor) {
            try {
                let match = this.circleColor.match(/\((.*?)\)/);
                if (match && match[1]) {
                    let colors = match[1].split(",");
                    return {
                        r: parseInt(colors[0]) / 255,
                        g: parseInt(colors[1]) / 255,
                        b: parseInt(colors[2]) / 255
                    };
                }
            } catch (e) {
                global.logError(UUID + ": Error parsing color: " + e.toString());
            }
        }
        // Return persistent random color
        return {
            r: this.randomColorR,
            g: this.randomColorG,
            b: this.randomColorB
        };
    },

    getTextStyle: function(fontSize, width) {
        return "font-size: " + fontSize + "px; " +
               "width: " + width + "px; " +
               "color: " + this.fontColor + ";";
    },

    formatBytes: function(bytes) {
        if (bytes <= 0) return "0 B";
        const units = ["B", "K", "M", "G", "T"];
        const k = 1024;
        const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + units[i];
    },

    refreshDecoration: function() {
        let header = this.type === "swap" ? _("Swap") : _("Memory");
        this.setHeader(header);
        this.metadata["prevent-decorations"] = this.hideDecorations;
        this._updateDecoration();
        //this.setupUI();
    },

    onSettingChanged: function() {
        this.setupUI();
        this.refreshDecoration();
        if (this.timeout) {
            Mainloop.source_remove(this.timeout);
            this.timeout = null;
        }
        this.update();
    },

    on_desklet_clicked: function() {
        if (this.onclickAction === "sysmonitor") {
            Util.spawnCommandLine("gnome-system-monitor -r");
        }
    },

    on_desklet_removed: function() {
        this.isDestroyed = true;
        if (this.timeout) {
            Mainloop.source_remove(this.timeout);
            this.timeout = null;
        }
    }
};
