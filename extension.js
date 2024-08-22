import GObject from "gi://GObject";
import St from "gi://St";

import {
  Extension,
  gettext as _,
} from "resource:///org/gnome/shell/extensions/extension.js";
import * as PanelMenu from "resource:///org/gnome/shell/ui/panelMenu.js";
import * as PopupMenu from "resource:///org/gnome/shell/ui/popupMenu.js";
import * as Util from "resource:///org/gnome/shell/misc/util.js";
import * as LoginManager from "resource:///org/gnome/shell/misc/loginManager.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

const Indicator = GObject.registerClass(
  class Indicator extends PanelMenu.Button {
    _init() {
      super._init(0.0, _("My Shiny Indicator"));

      this.add_child(
        new St.Icon({
          icon_name: "face-smile-symbolic",
          style_class: "system-status-icon",
        }),
      );

      this.menu.connect("open-state-changed", (menu, open) => {
        if (open) {
          this.loadSessions();
        }
      });

      // can't open an empty menu
      this.addNewSessionMenuItem();
    }

    loadSessions() {
      this.currentSession = undefined;
      this.availableSessions = undefined;

      LoginManager.getLoginManager()
        .listSessions()
        .then((sessions) => {
          this.availableSessions = sessions;
          this.displaySessions();
        });

      LoginManager.getLoginManager()
        .getCurrentSessionProxy()
        .then((session) => {
          this.currentSession = session;
          this.displaySessions();
        });
    }

    displaySessions() {
      if (this.availableSessions && this.currentSession) {
        this.menu.removeAll();

        console.log(this.availableSessions);
        console.log(this.currentSession);

        this.availableSessions.forEach((session) => {
          if (this.currentSession.Id !== session[0] && session[2] !== "gdm") {
            let item = new PopupMenu.PopupMenuItem(`${session[2]}`);
            item.connect("activate", () => {
              this._switchToSession(session[0]);
            });
            this.menu.addMenuItem(item);
          }
        });

        this.addNewSessionMenuItem();
      }
    }

    addNewSessionMenuItem() {
      let gdmItem = new PopupMenu.PopupMenuItem(_("New session..."));
      gdmItem.connect("activate", () => {
        this._switchToGDM();
      });

      this.menu.addMenuItem(gdmItem);
    }

    _switchToGDM() {
      const gdmProxy = new Gio.DBusProxy.new_for_bus_sync(
        Gio.BusType.SYSTEM,
        Gio.DBusProxyFlags.NONE,
        null,
        "org.gnome.DisplayManager",
        "/org/gnome/DisplayManager/LocalDisplayFactory",
        "org.gnome.DisplayManager.LocalDisplayFactory",
        null,
      );

      gdmProxy.call_sync(
        "CreateTransientDisplay",
        null,
        Gio.DBusCallFlags.NONE,
        -1,
        null,
      );
    }

    _switchToSession(sessionId) {
      const login1Proxy = new Gio.DBusProxy.new_for_bus_sync(
        Gio.BusType.SYSTEM,
        Gio.DBusProxyFlags.NONE,
        null,
        "org.freedesktop.login1",
        "/org/freedesktop/login1",
        "org.freedesktop.login1.Manager",
        null,
      );

      login1Proxy.call_sync(
        "ActivateSession",
        new GLib.Variant("(s)", [sessionId]),
        Gio.DBusCallFlags.NONE,
        -1,
        null,
      );
    }
  },
);

export default class IndicatorExampleExtension extends Extension {
  enable() {
    this._indicator = new Indicator();
    Main.panel.addToStatusArea(this.uuid, this._indicator);
  }

  disable() {
    this._indicator.destroy();
    this._indicator = null;
  }
}
