import AppKit

/// Owns the menu bar item, the reminder engine and the standalone reminder card.
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

    private let drinksItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
    private let sourceItem = NSMenuItem(title: "", action: nil, keyEquivalent: "")
    private let pauseItem = NSMenuItem(title: "Pause Reminders", action: #selector(togglePause), keyEquivalent: "")
    private let intervalMenu = NSMenu()

    private enum Pref {
        static let sounds = "soundsEnabled"
    }

    init() {
        item = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        buildMenu()

        engine.onPrompt = { [weak self] in self?.showReminder() }
        reminder.onYes = { [weak self] in self?.engine.recordDrink() }
        reminder.onLater = { [weak self] in self?.engine.snooze() }
        engine.start()

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
        menu.addItem(.separator())
        menu.addItem(withTitle: "Open VS Code", action: #selector(openVSCode), keyEquivalent: "o").target = self
        menu.addItem(.separator())
        menu.addItem(withTitle: "Quit Activ", action: #selector(quit), keyEquivalent: "q").target = self
        item.menu = menu
    }

    // MARK: Refresh loop

    private func refresh() {
        engine.tick(state: StateReader.read())

        guard let button = item.button else { return }
        drinksItem.title = "Drinks today: \(engine.drinksToday)"
        sourceItem.title = engine.isLeader ? "Schedule: Activ (VS Code not running)" : "Schedule: VS Code extension"
        pauseItem.title = engine.paused ? "Resume Reminders" : "Pause Reminders"
        for mi in intervalMenu.items { mi.state = mi.tag == engine.intervalMinutes ? .on : .off }

        guard let next = engine.effectiveNextAt else {
            button.title = "💧 paused"
            return
        }
        let remaining = max(0, Int(next.timeIntervalSinceNow.rounded()))
        button.title = "💧 next at \(clock.string(from: next)) - in \(remaining)s"
    }

    /// Only when VS Code is closed. While the extension runs, it shows the character and the bubble itself.
    private func showReminder() {
        guard engine.isLeader else { return }
        let sounds = UserDefaults.standard.object(forKey: Pref.sounds) as? Bool ?? true
        reminder.show(speak: sounds)
    }

    // MARK: Actions

    @objc private func drink() { engine.recordDrink() }
    @objc private func remindNow() { engine.remindNow() }
    @objc private func togglePause() { engine.paused.toggle() }
    @objc private func setInterval(_ sender: NSMenuItem) { engine.intervalMinutes = sender.tag }

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
