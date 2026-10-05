import AppKit

/// A click-through, always-on-top window the size of the buddy that walks along
/// the bottom edge of the main screen. Celebrates when PixelFriend logs a drink.
final class BuddyOverlay {
    private enum Mode { case walk, wave, dance, nice }

    private static let waveSeconds = 1.2
    private static let danceSeconds = 2.0
    private static let niceSeconds = 2.4
    private static let bubbleHeight: CGFloat = 58
    private static let minWidth: CGFloat = 170

    private let window: NSWindow
    private let view: BuddyView
    private var timer: Timer?

    private var sprites: SpriteSet = .builtIn(colors: .standard, scale: 4)
    private var signature = ""
    private var speed: Double = 1
    private var drinksToday = 0
    private var lastDrinkAt: Double?
    private var seenFirstState = false

    private var mode: Mode = .walk
    private var modeStart = Date()
    private var lastTick = Date()
    private var position = NSPoint(x: 80, y: 80)   // bottom-left of the sprite, screen coords
    private var target: NSPoint?
    private var idleUntil = Date()
    private var dir: CGFloat = 1

    init() {
        view = BuddyView()
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 200, height: 120),
                          styleMask: .borderless, backing: .buffered, defer: false)
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.level = .floating
        window.ignoresMouseEvents = true // never gets in the way of real work
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
        window.contentView = view
        layout()
    }

    var isVisible: Bool { window.isVisible }

    func show() {
        window.orderFrontRegardless()
        if timer == nil {
            lastTick = Date()
            timer = Timer.scheduledTimer(withTimeInterval: 1.0 / 30.0, repeats: true) { [weak self] _ in self?.tick() }
            RunLoop.main.add(timer!, forMode: .common)
        }
    }

    func hide() {
        timer?.invalidate()
        timer = nil
        window.orderOut(nil)
    }

    /// Called every second with the latest state file contents.
    func apply(_ state: SharedState) {
        drinksToday = state.drinksToday
        speed = state.avatar?.speed ?? 1

        if seenFirstState, let at = state.lastDrinkAt, at != lastDrinkAt {
            celebrate()
        }
        lastDrinkAt = state.lastDrinkAt
        seenFirstState = true

        let a = state.avatar
        let s = state.sprite
        let sig = "\(a?.scale ?? 4)|\(a?.shirtColor ?? "")|\(a?.hairColor ?? "")|\(a?.skinColor ?? "")|\(a?.pantsColor ?? "")|" +
                  "\(s?.path ?? "")|\(s?.frameWidth ?? 0)x\(s?.frameHeight ?? 0)|" +
                  "\(s?.walkFrames ?? 0)/\(s?.waveFrames ?? 0)/\(s?.danceFrames ?? 0)|\(s?.fps ?? 0)"
        if sig != signature {
            signature = sig
            rebuildSprites(state)
            layout()
        }
    }

    private func celebrate() {
        mode = .wave
        modeStart = Date()
        view.bubble = nil
        view.needsDisplay = true
    }

    private func rebuildSprites(_ state: SharedState) {
        let scale = CGFloat(state.avatar?.scale ?? 4)
        var colors = AvatarColors.standard
        if let a = state.avatar {
            colors = AvatarColors(
                shirt: NSColor(hex: a.shirtColor) ?? colors.shirt,
                hair: NSColor(hex: a.hairColor) ?? colors.hair,
                skin: NSColor(hex: a.skinColor) ?? colors.skin,
                pants: NSColor(hex: a.pantsColor) ?? colors.pants)
        }
        if let s = state.sprite, !s.path.isEmpty,
           let custom = SpriteSet.sheet(at: s.path, config: s, scale: max(1, (scale / 2).rounded())) {
            sprites = custom
        } else {
            sprites = .builtIn(colors: colors, scale: scale)
        }
    }

    private var screenFrame: NSRect {
        (NSScreen.main ?? NSScreen.screens.first)?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
    }

    /// The buddy may roam anywhere on the visible screen (above the Dock, below the menu bar).
    private var roamArea: NSRect {
        let screen = screenFrame
        let sprite = sprites.size
        return NSRect(x: screen.minX, y: screen.minY,
                      width: max(1, screen.width - sprite.width),
                      height: max(1, screen.height - sprite.height - Self.bubbleHeight))
    }

    private func clampPosition() {
        let area = roamArea
        position.x = min(max(position.x, area.minX), area.maxX)
        position.y = min(max(position.y, area.minY), area.maxY)
    }

    private func pickTarget() {
        let area = roamArea
        target = NSPoint(x: CGFloat.random(in: area.minX...area.maxX), y: CGFloat.random(in: area.minY...area.maxY))
    }

    private func layout() {
        let sprite = sprites.size
        let width = max(Self.minWidth, sprite.width)
        let height = sprite.height + Self.bubbleHeight
        view.spriteSize = sprite
        clampPosition()
        window.setFrame(NSRect(x: position.x - (width - sprite.width) / 2, y: position.y, width: width, height: height), display: true)
    }

    private func tick() {
        let now = Date()
        let dt = min(0.05, now.timeIntervalSince(lastTick))
        lastTick = now
        let since = now.timeIntervalSince(modeStart)

        switch mode {
        case .wave where since >= Self.waveSeconds:
            mode = .dance; modeStart = now
        case .dance where since >= Self.danceSeconds:
            mode = .nice; modeStart = now
            view.bubble = (title: "Nice!", subtitle: drinksToday > 0 ? "💧 \(drinksToday) today" : "")
        case .nice where since >= Self.niceSeconds:
            mode = .walk; modeStart = now
            view.bubble = nil
        default:
            break
        }

        var moving = false
        if mode == .walk && now >= idleUntil {
            if target == nil { pickTarget() }
            if let t = target {
                let dx = t.x - position.x, dy = t.y - position.y
                let dist = (dx * dx + dy * dy).squareRoot()
                let step = CGFloat(70 * speed) * CGFloat(dt)
                if dist <= step {
                    position = t
                    target = nil
                    idleUntil = now.addingTimeInterval(Double.random(in: 0.8...3.0)) // catch a breath
                } else {
                    position.x += dx / dist * step
                    position.y += dy / dist * step
                    dir = dx < 0 ? -1 : 1
                    moving = true
                }
                clampPosition()
                let width = window.frame.width
                window.setFrameOrigin(NSPoint(x: position.x - (width - sprites.size.width) / 2, y: position.y))
            }
        }

        let frames: [NSImage]
        let fps: Double
        let elapsed: TimeInterval
        switch mode {
        case .walk:
            frames = moving ? sprites.walk : [sprites.walk[0]]
            fps = sprites.isCustom ? sprites.fps : 7 * speed
            elapsed = now.timeIntervalSince1970
        case .wave: frames = sprites.wave; fps = sprites.isCustom ? sprites.fps : 4; elapsed = since
        case .dance: frames = sprites.dance; fps = sprites.fps; elapsed = since
        case .nice: frames = sprites.wave; fps = 1; elapsed = 0
        }
        let index = Int(elapsed * fps) % max(1, frames.count)
        view.image = frames.isEmpty ? nil : frames[index]
        view.faceLeft = mode == .walk && dir < 0
        view.needsDisplay = true
    }
}

/// Draws the current frame at the bottom-center plus an optional speech bubble.
final class BuddyView: NSView {
    var image: NSImage?
    var faceLeft = false
    var spriteSize = NSSize(width: 48, height: 64)
    var bubble: (title: String, subtitle: String)?

    override var isOpaque: Bool { false }

    override func draw(_ dirtyRect: NSRect) {
        guard let ctx = NSGraphicsContext.current else { return }
        ctx.imageInterpolation = .none

        let rect = NSRect(x: (bounds.width - spriteSize.width) / 2, y: 0, width: spriteSize.width, height: spriteSize.height)
        if let image = image {
            ctx.saveGraphicsState()
            if faceLeft {
                let flip = NSAffineTransform()
                flip.translateX(by: rect.minX + rect.maxX, yBy: 0)
                flip.scaleX(by: -1, yBy: 1)
                flip.concat()
            }
            image.draw(in: rect, from: .zero, operation: .sourceOver, fraction: 1)
            ctx.restoreGraphicsState()
        }

        guard let bubble = bubble else { return }
        let titleAttrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 15, weight: .bold), .foregroundColor: NSColor.white]
        let subAttrs: [NSAttributedString.Key: Any] = [
            .font: NSFont.systemFont(ofSize: 11), .foregroundColor: NSColor.white.withAlphaComponent(0.8)]
        let title = NSAttributedString(string: bubble.title, attributes: titleAttrs)
        let sub = NSAttributedString(string: bubble.subtitle, attributes: subAttrs)
        let textW = max(title.size().width, sub.size().width)
        let textH = title.size().height + (bubble.subtitle.isEmpty ? 0 : sub.size().height)
        let box = NSRect(x: (bounds.width - textW) / 2 - 10, y: rect.maxY + 14, width: textW + 20, height: textH + 10)

        NSColor(calibratedWhite: 0.13, alpha: 0.95).setFill()
        NSBezierPath(roundedRect: box, xRadius: 9, yRadius: 9).fill()
        let tail = NSBezierPath()
        tail.move(to: NSPoint(x: box.midX - 6, y: box.minY))
        tail.line(to: NSPoint(x: box.midX, y: box.minY - 7))
        tail.line(to: NSPoint(x: box.midX + 6, y: box.minY))
        tail.close()
        tail.fill()

        var y = box.maxY - 5 - title.size().height
        title.draw(at: NSPoint(x: box.midX - title.size().width / 2, y: y))
        if !bubble.subtitle.isEmpty {
            y -= sub.size().height
            sub.draw(at: NSPoint(x: box.midX - sub.size().width / 2, y: y))
        }
    }
}
