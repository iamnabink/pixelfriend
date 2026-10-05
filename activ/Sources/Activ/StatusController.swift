import AppKit

/// Owns the menu bar item, the reminder engine, the reminder card and the desktop companion.
final class StatusController {
    private let item: NSStatusItem
    private var timer: Timer?
    private let clock: DateFormatter = {
        let f = DateFormatter()
        f.locale = Locale(identifier: "en_US_POSIX") // always HH:mm, even with the 12-hour system setting
        f.dateFormat = "HH:mm"
        return f
    }()

    private let engine = ReminderEngine()
    private let reminder = ReminderPanel()
    private lazy var pixelOverlay = BuddyOverlay()
    private lazy var characterOverlay = CharacterOverlay()

    private let drinksItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
    private let sourceItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
    private let pauseItem = NSMenuItem(title: "Pause Reminders", action: #selector(togglePause), keyEquivalent: "")
    private let buddyItem = NSMenuItem(title: "Show Desktop Buddy", action: #selector(toggleBuddy), keyEquivalent: "b")
    private let intervalMenu = NSMenu()
    private let styleMenu = NSMenu()

    private enum Pref {
        static let showBuddy = "showDesktopBuddy"
        static let style = "avatarStyle"      // "cartoon" | "pixel"
        static let sounds = "soundsEnabled"
    }
    private var avatarStyle: String {
        get { UserDefaults.standard.string(forKey: Pref.style) ?? "cartoon" }
        set { UserDefaults.standard.set(newValue, forKey: Pref.style) }
    }

    init() {
        item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        buildMenu()

        engine.onPrompt = { [weak self] in self?.showReminder() }
        engine.onStateChange = { [weak self] state in self?.applyToOverlays(state) }
        reminder.onYes = { [weak self] in self?.engine.recordDrink() }
        reminder.onLater = { [weak self] in self?.engine.snooze() }
        characterOverlay.onYes = { [weak self] in self?.engine.recordDrink() }
        engine.start()

        if UserDefaults.standard.object(forKey: Pref.showBuddy) as? Bool ?? true { currentOverlayShow() }
        buddyItem.state = overlayVisible ? .on : .off

        refresh()
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [weak self] _ in self?.refresh() }
        RunLoop.main.add(timer!, forMode: .common)
    }

    // MARK: Menu

    private func buildMenu() {
        let menu = NSMenu()
        drinksItem.isEnabled = false
        menu.addItem(drinksItem)
        sourceItem.isEnabled = false
        menu.addItem(sourceItem)
        menu.addItem(.separator())
        menu.addItem(withTitle: "I Drank Water 💧", action: #selector(drink), keyEquivalent: "d").target = self
        menu.addItem(withTitle: "Remind Me Now", action: #selector(remindNow), keyEquivalent: "r").target = self
        pauseItem.target = self
        menu.addItem(pauseItem)
        menu.addItem(.separator())

        let intervalItem = NSMenuItem(title: "Remind Every", action: nil, keyEquivalent: "")
        for minutes in [15, 30, 45, 60, 90, 120] {
            let mi = NSMenuItem(title: "\(minutes) minutes", action: #selector(setInterval(_:)), keyEquivalent: "")
            mi.tag = minutes
            mi.target = self
            intervalMenu.addItem(mi)
        }
        intervalItem.submenu = intervalMenu
        menu.addItem(intervalItem)

        let styleItem = NSMenuItem(title: "Avatar", action: nil, keyEquivalent: "")
        for (title, id) in [("Cartoon Character", "cartoon"), ("Pixel Buddy", "pixel")] {
            let mi = NSMenuItem(title: title, action: #selector(setStyle(_:)), keyEquivalent: "")
            mi.representedObject = id
            mi.target = self
            styleMenu.addItem(mi)
        }
        styleItem.submenu = styleMenu
        menu.addItem(styleItem)

        buddyItem.target = self
        menu.addItem(buddyItem)
        menu.addItem(.separator())
        menu.addItem(withTitle: "Open VS Code", action: #selector(openVSCode), keyEquivalent: "o").target = self
        menu.addItem(.separator())
        menu.addItem(withTitle: "Quit Activ", action: #selector(quit), keyEquivalent: "q").target = self
        item.menu = menu
    }

    // MARK: Refresh loop

    private func refresh() {
        let state = StateReader.read()
        engine.tick(state: state)
        if let s = state { applyToOverlays(s) }

        guard let button = item.button else { return }
        drinksItem.title = "Drinks today: \(engine.drinksToday)"
        sourceItem.title = engine.isLeader ? "Schedule: Activ (VS Code not running)" : "Schedule: VS Code extension"
        pauseItem.title = engine.paused ? "Resume Reminders" : "Pause Reminders"
        for mi in intervalMenu.items { mi.state = mi.tag == engine.intervalMinutes ? .on : .off }
        for mi in styleMenu.items { mi.state = (mi.representedObject as? String) == avatarStyle ? .on : .off }

        guard let next = engine.effectiveNextAt else {
            button.title = "💧 paused"
            return
        }
        let remaining = max(0, Int(next.timeIntervalSinceNow.rounded()))
        button.title = "💧 next at \(clock.string(from: next)) - in \(remaining)s"
    }

    private func applyToOverlays(_ state: SharedState) {
        pixelOverlay.apply(state)
        characterOverlay.apply(state)
    }

    private func showReminder() {
        let sounds = UserDefaults.standard.object(forKey: Pref.sounds) as? Bool ?? true
        if avatarStyle == "cartoon" && characterOverlay.isVisible {
            characterOverlay.ask(speak: sounds) // bubble on the desktop character, stays until YES
        } else {
            reminder.show(speak: sounds)
        }
    }

    // MARK: Overlay switching

    private var overlayVisible: Bool { pixelOverlay.isVisible || characterOverlay.isVisible }

    private func currentOverlayShow() {
        if avatarStyle == "cartoon" { pixelOverlay.hide(); characterOverlay.show() }
        else { characterOverlay.hide(); pixelOverlay.show() }
    }

    private func overlayHide() { pixelOverlay.hide(); characterOverlay.hide() }

    // MARK: Actions

    @objc private func drink() { engine.recordDrink() }
    @objc private func remindNow() { engine.remindNow() }
    @objc private func togglePause() { engine.paused.toggle() }
    @objc private func setInterval(_ sender: NSMenuItem) { engine.intervalMinutes = sender.tag }
    @objc private func setStyle(_ sender: NSMenuItem) {
        avatarStyle = (sender.representedObject as? String) ?? "cartoon"
        if overlayVisible { currentOverlayShow() }
    }
    @objc private func toggleBuddy() {
        if overlayVisible { overlayHide() } else { currentOverlayShow() }
        buddyItem.state = overlayVisible ? .on : .off
        UserDefaults.standard.set(overlayVisible, forKey: Pref.showBuddy)
    }

    @objc private func openVSCode() {
        let config = NSWorkspace.OpenConfiguration()
        for id in ["com.microsoft.VSCode", "com.microsoft.VSCodeInsiders"] {
            if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: id) {
                NSWorkspace.shared.openApplication(at: url, configuration: config)
                return
            }
        }
    }

    @objc private func quit() { NSApp.terminate(nil) }
}
