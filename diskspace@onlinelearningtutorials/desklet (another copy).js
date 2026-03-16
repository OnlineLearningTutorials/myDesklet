const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const Lang = imports.lang;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Gio = imports.gi.Gio;
const Gettext = imports.gettext;

const UUID = "diskspace@onlinelearningtutorials";

function _(str) {
    return Gettext.dgettext(UUID, str);
}

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

function main(metadata, desklet_id) {
    return new MyDesklet(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata);
        this.driveData = [];
        this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], desklet_id);
        
        this.settings.bindProperty(Settings.BindingDirection.IN, "size-prefix", "size_prefix", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scale_size", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "circle-color", "circle_color", this.on_setting_changed);
        this.settings.bindProperty(Settings.BindingDirection.IN, "use-own-circle-color", "use_own_circle_color", this.on_setting_changed);

        this.setupUI();
    },

    setupUI: function() {
        // Create a background container
        this.mainContainer = new St.Bin({
            style: 'background-color: rgba(0, 0, 0, 0.4); border-radius: 8px; padding: 10px;'
        });
        
        this.canvas = new Clutter.Actor();
        this.mainContainer.set_child(this.canvas);
        this.setContent(this.mainContainer);
        this.update();
    },

    update: function() {
        if (this.timeout) Mainloop.source_remove(this.timeout);
        this.refreshDesklet();
        this.timeout = Mainloop.timeout_add_seconds(10, Lang.bind(this, this.update));
    },

    refreshDesklet: function() {
        this.driveData = [];
        let monitor = Gio.VolumeMonitor.get();
        let mounts = monitor.get_mounts();
        let pathsSeen = new Set();

        let processPath = (name, path) => {
            if (pathsSeen.has(path)) return;
            try {
                let file = Gio.file_new_for_path(path);
                let info = file.query_filesystem_info("filesystem::*", null);
                
                let total = info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_SIZE);
                let freePhys = info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE);
                let availUser = info.get_attribute_uint64("filesystem::free");
                
                let reserved = freePhys - availUser;
                let used = total - freePhys;

                if (total > 0) {
                    this.driveData.push({
                        name: name,
                        free: availUser,
                        reserved: (reserved > 0) ? reserved : 0, // Clean 0b check
                        total: total,
                        percentUsed: (used / total),
                        percentRes: (reserved > 0) ? (reserved / total) : 0
                    });
                    pathsSeen.add(path);
                }
            } catch (e) {}
        };

        processPath(_("File System"), "/");
        let targetMounts = ['/mnt/Acer', '/mnt/store', '/mnt/lmde', '/mnt/mydata'];
        for (let m of targetMounts) processPath(m.split('/').pop(), m);
        for (let m of mounts) processPath(m.get_name(), m.get_root().get_path());

        this.redraw();
    },

    redraw: function() {
        let barH = 4 * this.scale_size;
        let gap = 35 * this.scale_size;
        let width = 300 * this.scale_size;
        let totalH = this.driveData.length * (barH + gap);

        let canvas = new Clutter.Canvas();
        canvas.set_size(width, totalH);

        canvas.connect("draw", Lang.bind(this, (canvas, cr, w, h) => {
            cr.setOperator(Cairo.Operator.CLEAR);
            cr.paint();
            cr.setOperator(Cairo.Operator.OVER);

            let r=0.2, g=0.6, b=1.0; 
            if (this.use_own_circle_color) {
                let colors = this.circle_color.match(/\((.*?)\)/)[1].split(",");
                r = parseInt(colors[0])/255; g = parseInt(colors[1])/255; b = parseInt(colors[2])/255;
            }

            for (let i = 0; i < this.driveData.length; i++) {
                let d = this.driveData[i];
                let y = i * (barH + gap);

                // Drive Name
                cr.setSourceRGBA(1, 1, 1, 1);
                cr.setFontSize(11 * this.scale_size);
                cr.moveTo(0, y + 10);
                cr.showText(d.name);

                // Space Stats - Hidden Reserved if 0b
                cr.setFontSize(9 * this.scale_size);
                cr.setSourceRGBA(1, 1, 1, 0.6);
                cr.moveTo(0, y + 22);
                let statText = `Free: ${this.niceSize(d.free)} | Total: ${this.niceSize(d.total)}`;
                if (d.reserved > 0) {
                    statText = `Free: ${this.niceSize(d.free)} | Res: ${this.niceSize(d.reserved)} | Total: ${this.niceSize(d.total)}`;
                }
                cr.showText(statText);

                // Background Bar
                cr.rectangle(0, y + 28, width, barH);
                cr.setSourceRGBA(1, 1, 1, 0.1);
                cr.fill();

                let usedW = d.percentUsed * width;
                let resW = d.percentRes * width;

                // 1. Used Space
                cr.rectangle(0, y + 28, usedW, barH);
                if (d.free === 0) cr.setSourceRGBA(0.9, 0.1, 0.1, 1);
                else cr.setSourceRGBA(r, g, b, 1);
                cr.fill();

                // 2. Reserved Space (Only draws if > 0)
                if (resW > 0) {
                    cr.rectangle(usedW, y + 28, resW, barH);
                    cr.setSourceRGBA(1, 0.6, 0, 0.8); 
                    cr.fill();
                }
            }
            return true;
        }));

        canvas.invalidate();
        this.canvas.set_content(canvas);
        this.canvas.set_size(width, totalH);
    },

    niceSize: function(value) {
        let factor = (this.size_prefix == "binary") ? 1024 : 1000;
        let suffixes = (this.size_prefix == "binary") ? ["B", "KiB", "MiB", "GiB", "TiB"] : ["B", "KB", "MB", "GB", "TB"];
        let i = 0;
        while (value >= factor && i < suffixes.length - 1) { value /= factor; i++; }
        return Math.round(value * 10) / 10 + " " + suffixes[i];
    },

    on_setting_changed: function() { this.update(); },
    on_desklet_removed: function() { if (this.timeout) Mainloop.source_remove(this.timeout); }
};
