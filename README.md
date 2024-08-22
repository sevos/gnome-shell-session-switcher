# SevosIO: Session Switcher

This GNOME Shell extension creates a menu in the top bar allowing to quickly access other user sessions, or login as another user.
It provides a quicker way (less clicks) then regular GNOME.

## Installation

**Tested on Fedora 40**

You need to create a Polkit rule to allow users switching between sessions.

Create the new policy:

```
sudo nano /etc/polkit-1/rules.d/99-gnome-shell-activate-session.rules
```

```
polkit.addRule(function(action, subject) {
    if ((action.id == "org.freedesktop.login1.manage" ||
         action.id == "org.freedesktop.login1.chvt") &&
        subject.isInGroup("wheel")) {
        return polkit.Result.YES;
    }
});
```

This policy allows administrators who belong to `wheel` group use this plugin.

Next, install this plugin in all users' GNOME environments.
