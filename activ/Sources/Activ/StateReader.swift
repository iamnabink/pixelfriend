import Foundation

struct AvatarConfig: Decodable {
    var style: String?
    var scale: Double
    var speed: Double
    var shirtColor: String
    var hairColor: String
    var skinColor: String
    var pantsColor: String
}

struct SpriteConfig: Decodable {
    var path: String
    var frameWidth: Int
    var frameHeight: Int
    var walkFrames: Int
    var waveFrames: Int
    var danceFrames: Int
    var fps: Int
}

/// Mirrors the JSON written by the PixelFriend VS Code extension.
struct SharedState: Decodable {
    var version: Int
    var nextReminderAt: Double?   // epoch milliseconds
    var intervalMinutes: Double
    var paused: Bool
    var drinksToday: Int
    var lastDrinkAt: Double?
    var updatedAt: Double
    var avatar: AvatarConfig?     // optional so older state files still decode
    var sprite: SpriteConfig?

    var nextReminderDate: Date? {
        guard let ms = nextReminderAt else { return nil }
        return Date(timeIntervalSince1970: ms / 1000)
    }
}

enum StateReader {
    /// Resolution order: ACTIV_STATE_FILE env var, then the PixelFriend default.
    static var stateURL: URL {
        if let override = ProcessInfo.processInfo.environment["ACTIV_STATE_FILE"], !override.isEmpty {
            return URL(fileURLWithPath: (override as NSString).expandingTildeInPath)
        }
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
        return support.appendingPathComponent("PixelFriend/state.json")
    }

    static func read() -> SharedState? {
        guard let data = try? Data(contentsOf: stateURL) else { return nil }
        return try? JSONDecoder().decode(SharedState.self, from: data)
    }
}
