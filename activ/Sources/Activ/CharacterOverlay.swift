import AppKit

/// The cartoon character as a click-through desktop companion that drifts between spots on screen.
/// Borderless windows refuse key status by default; we want clicks and drags.
private final class OverlayWindow: NSWindow {
    override var canBecomeKey: Bool { true }
}

/// Sits on top of the web view: drag moves the window, a plain click is reported to the overlay.
private final class DragCatcher: NSView {
    var onClick: (() -> Void)?
    var onMoved: (() -> Void)?
    private var start: NSPoint?
    private var moved = false

    override func mouseDown(with event: NSEvent) {
        start = event.locationInWindow
        moved = false
    }

    override func mouseDragged(with event: NSEvent) {
        guard let start, let window else { return }
        let dx = event.locationInWindow.x - start.x, dy = event.locationInWindow.y - start.y
        if !moved && (dx * dx + dy * dy).squareRoot() < 4 { return }
        moved = true
        window.setFrameOrigin(NSPoint(x: window.frame.origin.x + dx, y: window.frame.origin.y + dy))
    }

    override func mouseUp(with event: NSEvent) {
        if moved { onMoved?() } else { onClick?() }
        start = nil
        moved = false
    }

    override func resetCursorRects() { addCursorRect(bounds, cursor: .openHand) }
}

final class CharacterOverlay {
    private let window: NSWindow
    private let web: CharacterWebView
    private let speaker = Speaker()
    private var timer: Timer?
    private var asking = false
    /// Fired when the bubble's YES is tapped.
    var onYes: (() -> Void)?
    private var position = NSPoint(x: 120, y: 120)
    private var target: NSPoint?
    private var idleUntil = Date()
    private var lastTick = Date()
    private var lastDrinkAt: Double?
    private var seenFirstState = false

    init() {
        let size = NSSize(width: 165, height: 220) // about a third smaller than the first cut
        window = OverlayWindow(contentRect: NSRect(origin: .zero, size: size), styleMask: .borderless, backing: .buffered, defer: false)
        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.level = .floating
        window.ignoresMouseEvents = false // draggable; a tap while asking counts as YES
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary, .ignoresCycle]
        web = CharacterWebView(frame: NSRect(origin: .zero, size: size), transparent: true, framing: "full")
        let content = NSView(frame: NSRect(origin: .zero, size: size))
        web.autoresizingMask = [.width, .height]
        content.addSubview(web)
        let catcher = DragCatcher(frame: content.bounds)
        catcher.autoresizingMask = [.width, .height]
        catcher.onClick = { [weak self] in self?.tapped() }
        catcher.onMoved = { [weak self] in
            guard let self else { return }
            self.position = self.window.frame.origin
            self.target = nil
            self.idleUntil = Date().addingTimeInterval(90) // stay where you put him for a while
        }
        content.addSubview(catcher)
        window.contentView = content
        web.onMessage = { [weak self] type in
            guard let self, type == "yes" else { return }
            self.finishAsking()
            self.onYes?()
        }
        speaker.onWord = { [weak self] i in self?.web.wordBoundary(i) }
        speaker.onFinish = { [weak self] in self?.web.speechEnd() }
        clamp()
        window.setFrameOrigin(position)
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
        timer?.invalidate(); timer = nil
        window.orderOut(nil)
    }

    func apply(_ state: SharedState) {
        if seenFirstState, let at = state.lastDrinkAt, at != lastDrinkAt {
            web.celebrate()
            finishAsking()
        }
        lastDrinkAt = state.lastDrinkAt
        seenFirstState = true
    }

    /// Show the "Did you drink water?" bubble. The character stops drifting and becomes tappable until YES.
    func ask(speak: Bool) {
        asking = true
        window.orderFrontRegardless()
        web.ask()
        if speak { speaker.speak("Hi, do you have water?") }
    }

    /// A tap on the character while he is asking means "yes, I drank".
    private func tapped() {
        guard asking else { return }
        web.celebrate()
        finishAsking()
        onYes?()
    }

    private func finishAsking() {
        guard asking else { return }
        asking = false
        speaker.stop()
        idleUntil = Date().addingTimeInterval(3)
    }

    private var area: NSRect {
        let f = (NSScreen.main ?? NSScreen.screens.first)?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        return NSRect(x: f.minX, y: f.minY, width: max(1, f.width - window.frame.width), height: max(1, f.height - window.frame.height))
    }

    private func clamp() {
        let a = area
        position.x = min(max(position.x, a.minX), a.maxX)
        position.y = min(max(position.y, a.minY), a.maxY)
    }

    private func tick() {
        let now = Date()
        let dt = min(0.05, now.timeIntervalSince(lastTick))
        lastTick = now
        guard !asking, now >= idleUntil else { return }
        if target == nil {
            let a = area
            target = NSPoint(x: CGFloat.random(in: a.minX...a.maxX), y: CGFloat.random(in: a.minY...a.maxY))
        }
        guard let t = target else { return }
        let dx = t.x - position.x, dy = t.y - position.y
        let dist = (dx * dx + dy * dy).squareRoot()
        let step = CGFloat(55 * dt)
        if dist <= step {
            position = t; target = nil
            idleUntil = now.addingTimeInterval(Double.random(in: 6...20)) // linger for a while
        } else {
            position.x += dx / dist * step; position.y += dy / dist * step
        }
        clamp()
        window.setFrameOrigin(position)
    }
}
