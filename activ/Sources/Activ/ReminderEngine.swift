import Foundation

/// Standalone reminder logic for the macOS app. Mirrors the VS Code extension's scheduler.
/// When the VS Code extension is alive (fresh heartbeat in state.json) Activ follows its schedule
/// and relays answers through command.json; otherwise Activ owns the timer and writes state.json itself.
final class ReminderEngine {
    private let defaults = UserDefaults.standard
    private enum Key {
        static let interval = "reminderIntervalMinutes"
        static let snooze = "snoozeMinutes"
        static let paused = "paused"
        static let nextAt = "nextReminderAt"
        static let drinkDate = "drinkDate"
        static let drinkCount = "drinkCount"
        static let lastDrinkAt = "lastDrinkAt"
    }
    private static let heartbeatWindow: TimeInterval = 150

    private(set) var lastState: SharedState?
    private var promptedFor: Double?
    var onPrompt: (() -> Void)?
    var onStateChange: ((SharedState) -> Void)?

    var intervalMinutes: Int {
        get { max(1, defaults.object(forKey: Key.interval) as? Int ?? 60) }
        set { defaults.set(newValue, forKey: Key.interval); if isLeader { scheduleInterval() } }
    }
    var snoozeMinutes: Int { max(1, defaults.object(forKey: Key.snooze) as? Int ?? 5) }
    var paused: Bool {
        get { defaults.bool(forKey: Key.paused) }
        set { defaults.set(newValue, forKey: Key.paused); if newValue { nextAt = nil } else { scheduleInterval() }; publish() }
    }
    private var nextAt: Date? {
        get { defaults.object(forKey: Key.nextAt) as? Date }
        set { defaults.set(newValue, forKey: Key.nextAt) }
    }

    /// True when VS Code's extension wrote the state file recently.
    var isLeader: Bool {
        guard let s = lastState else { return true }
        return Date().timeIntervalSince1970 - s.updatedAt / 1000 > Self.heartbeatWindow
    }

    var effectiveNextAt: Date? {
        if isLeader { return paused ? nil : nextAt }
        return lastState?.paused == true ? nil : lastState?.nextReminderDate
    }

    var drinksToday: Int {
        if !isLeader, let s = lastState { return s.drinksToday }
        return defaults.string(forKey: Key.drinkDate) == Self.today ? defaults.integer(forKey: Key.drinkCount) : 0
    }

    func start() {
        if isLeader && !paused && nextAt == nil { scheduleInterval() }
        publish()
    }

    /// Called every second with the freshly read state file (nil if missing).
    func tick(state: SharedState?) {
        lastState = state
        guard let next = effectiveNextAt else { return }
        let key = next.timeIntervalSince1970
        if Date() >= next && promptedFor != key {
            promptedFor = key
            onPrompt?()
        }
    }

    func recordDrink() {
        if isLeader {
            let today = Self.today
            let count = defaults.string(forKey: Key.drinkDate) == today ? defaults.integer(forKey: Key.drinkCount) : 0
            defaults.set(today, forKey: Key.drinkDate)
            defaults.set(count + 1, forKey: Key.drinkCount)
            defaults.set(Date().timeIntervalSince1970 * 1000, forKey: Key.lastDrinkAt)
            scheduleInterval()
        } else {
            writeCommand("drink")
        }
    }

    func snooze() {
        if isLeader {
            nextAt = Date().addingTimeInterval(Double(snoozeMinutes) * 60)
            publish()
        } else {
            writeCommand("snooze")
        }
    }

    func remindNow() { onPrompt?() }

    private func scheduleInterval() {
        nextAt = Date().addingTimeInterval(Double(intervalMinutes) * 60)
        promptedFor = nil
        publish()
    }

    /// Leader mode: write state.json so the menu bar, overlay and a later VS Code session agree.
    private func publish() {
        guard isLeader else { return }
        let state = SharedState(
            version: 1,
            nextReminderAt: paused ? nil : nextAt.map { $0.timeIntervalSince1970 * 1000 },
            intervalMinutes: Double(intervalMinutes),
            paused: paused,
            drinksToday: drinksToday,
            lastDrinkAt: defaults.object(forKey: Key.lastDrinkAt) as? Double,
            updatedAt: 0, // 0 marks "written by Activ", so it never looks like a VS Code heartbeat
            avatar: lastState?.avatar,
            sprite: lastState?.sprite)
        lastState = state
        StateWriter.write(state)
        onStateChange?(state)
    }

    private func writeCommand(_ action: String) {
        let url = StateReader.stateURL.deletingLastPathComponent().appendingPathComponent("command.json")
        let body: [String: Any] = ["action": action, "at": Date().timeIntervalSince1970 * 1000]
        if let data = try? JSONSerialization.data(withJSONObject: body) { try? data.write(to: url, options: .atomic) }
    }

    private static var today: String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date())
    }
}

enum StateWriter {
    static func write(_ state: SharedState) {
        var dict: [String: Any] = [
            "version": state.version,
            "nextReminderAt": state.nextReminderAt as Any,
            "intervalMinutes": state.intervalMinutes,
            "paused": state.paused,
            "drinksToday": state.drinksToday,
            "lastDrinkAt": state.lastDrinkAt as Any,
            "updatedAt": state.updatedAt,
        ]
        if let a = state.avatar {
            dict["avatar"] = ["style": a.style ?? "cartoon", "scale": a.scale, "speed": a.speed, "shirtColor": a.shirtColor,
                              "hairColor": a.hairColor, "skinColor": a.skinColor, "pantsColor": a.pantsColor]
        }
        if let s = state.sprite {
            dict["sprite"] = ["path": s.path, "frameWidth": s.frameWidth, "frameHeight": s.frameHeight, "walkFrames": s.walkFrames,
                              "waveFrames": s.waveFrames, "danceFrames": s.danceFrames, "fps": s.fps]
        }
        let url = StateReader.stateURL
        try? FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
        if let data = try? JSONSerialization.data(withJSONObject: dict, options: [.prettyPrinted, .sortedKeys]) {
            try? data.write(to: url, options: .atomic)
        }
    }
}
