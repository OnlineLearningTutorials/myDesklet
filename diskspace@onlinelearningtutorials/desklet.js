const Desklet = imports.ui.desklet;
const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Settings = imports.ui.settings;
const Clutter = imports.gi.Clutter;
const Cairo = imports.cairo;
const Gio = imports.gi.Gio;

function MyDesklet(metadata, desklet_id) {
    this._init(metadata, desklet_id);
}

MyDesklet.prototype = {
    __proto__: Desklet.Desklet.prototype,

    _init: function(metadata, desklet_id) {
        Desklet.Desklet.prototype._init.call(this, metadata);
        this.driveData = [];
        this.settings = new Settings.DeskletSettings(this, this.metadata["uuid"], desklet_id);
        
        this.settings.bindProperty(Settings.BindingDirection.IN, "size-prefix", "size_prefix", () => this.update());
        this.settings.bindProperty(Settings.BindingDirection.IN, "scale-size", "scale_size", () => this.update());
        
        // Modern Liquid Glass container
        this.mainContainer = new St.Bin({ 
            style: 'background-color: rgba(255, 255, 255, 0.08); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px; padding: 20px;' 
        });
        
        this.canvas = new Clutter.Actor();
        this.mainContainer.set_child(this.canvas);
        this.setContent(this.mainContainer);
        
        this.update();
    },

    update: function() {
        if (this.timeout) Mainloop.source_remove(this.timeout);
        this.refreshDriveData();
        this.timeout = Mainloop.timeout_add_seconds(10, () => this.update());
    },

    refreshDriveData: function() {
        this.driveData = [];
        let monitor = Gio.VolumeMonitor.get();
        let mounts = monitor.get_mounts();

        let processPath = (name, path) => {
            try {
                let file = Gio.file_new_for_path(path);
                let info = file.query_filesystem_info("filesystem::*", null);
                let total = info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_SIZE);
                let free = info.get_attribute_uint64("filesystem::free");
                let used = total - info.get_attribute_uint64(Gio.FILE_ATTRIBUTE_FILESYSTEM_FREE);

                if (total > 0) {
                    let label = (path === "/") ? "Root (/)" : name;
                    this.driveData.push({ name: label, free: free, total: total, percentUsed: (used / total) });
                }
            } catch (e) {}
        };

        processPath("/", "/");
        for (let m of mounts) processPath(m.get_name(), m.get_root().get_path());
        this.drawLiquidStyle();
    },

    drawLiquidStyle: function() {
        let scale = (this.scale_size || 1);
        let width = 300 * scale;
        let barH = 12 * scale;
        let totalH = this.driveData.length * 75;

        let canvas = new Clutter.Canvas();
        canvas.set_size(width, totalH);

        canvas.connect("draw", (canvas, cr) => {
            cr.setOperator(Cairo.Operator.CLEAR);
            cr.paint();
            cr.setOperator(Cairo.Operator.OVER);

            this.driveData.forEach((d, i) => {
                let y = i * 75;
                
                // Name - Clean Linux Sans
                cr.setSourceRGBA(1, 1, 1, 0.95);
                cr.selectFontFace("Sans", Cairo.FontSlant.Normal, Cairo.FontWeight.Normal);
                cr.setFontSize(13 * scale);
                cr.moveTo(0, y + 15);
                cr.showText(d.name);

                // Bar Background - Frosted
                this.roundedRect(cr, 0, y + 25, width, barH, barH/2);
                cr.setSourceRGBA(1, 1, 1, 0.1);
                cr.fill();

                // Liquid Blue Bar - Adwaita style
                let usedW = Math.max(barH, d.percentUsed * width);
                let grad = new Cairo.LinearGradient(0, y + 25, 0, y + 25 + barH);
                grad.addColorStopRGBA(0, 0.1, 0.6, 0.9, 1);
                grad.addColorStopRGBA(1, 0.05, 0.4, 0.8, 1);
                
                this.roundedRect(cr, 0, y + 25, usedW, barH, barH/2);
                cr.setSource(grad);
                cr.fill();

                // Stats Text
                cr.setFontSize(9 * scale);
                cr.setSourceRGBA(0.8, 0.8, 0.8, 1);
                cr.moveTo(0, y + 55);
                cr.showText(this.niceSize(d.free) + " free / " + this.niceSize(d.total) + " total");
            });
            return true;
        });

        canvas.invalidate();
        this.canvas.set_content(canvas);
        this.canvas.set_size(width, totalH);
    },

    roundedRect: function(cr, x, y, w, h, r) {
        cr.newPath();
        cr.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI);
        cr.arc(x + w - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI);
        cr.arc(x + w - r, y + h - r, r, 0, 0.5 * Math.PI);
        cr.arc(x + r, y + h - r, r, 0.5 * Math.PI, Math.PI);
        cr.closePath();
    },

    niceSize: function(value) {
        let factor = (this.size_prefix === "binary") ? 1024 : 1000;
        let suffixes = (this.size_prefix === "binary") ? ["B", "KiB", "MiB", "GiB", "TiB"] : ["B", "KB", "MB", "GB", "TB"];
        let i = 0;
        while (value >= factor && i < suffixes.length - 1) { value /= factor; i++; }
        return Math.round(value * 10) / 10 + " " + suffixes[i];
    }
};

function main(metadata, desklet_id) { return new MyDesklet(metadata, desklet_id); }
