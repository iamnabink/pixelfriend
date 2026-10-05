import AppKit

/// Floating reminder card: the cartoon character raises a hand and asks "Hi, do you have water?"
final class ReminderPanel {
    private let panel: NSPanel
    private let web: CharacterWebView
    private let speaker = Speaker()
    private let title = NSTextField(labelWithString: "Hi, do you have water?")
    private let yesButton = NSButton(title: "YES 💧", target: nil, action: nil)
    private let laterButton = NSButton(title: "Remind me later", target: nil, action: nil)
    private let niceLabel = NSTextField(labelWithString: "Nice!")
    private var hideTimer: Timer?

    var onYes: (() -> Void)?
    var onLater: (() -> Void)?

    init() {
        let size = NSSize(width: 320, height: 440)
        panel = NSPanel(contentRect: NSRect(origin: .zero, size: size),
                        styleMask: [.borderless, .nonactivatingPanel], backing: .buffered, defer: false)
        panel.level = .floating
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary]
        panel.isMovableByWindowBackground = true

        let container = NSVisualEffectView(frame: NSRect(origin: .zero, size: size))
        container.material = .hudWindow
        container.state = .active
        container.wantsLayer = true
        container.layer?.cornerRadius = 18
        container.layer?.masksToBounds = true
        panel.contentView = container

        web = CharacterWebView(frame: NSRect(x: 0, y: 110, width: size.width, height: size.height - 110),
                               transparent: true, framing: "full")
        web.autoresizingMask = [.width, .height]
        container.addSubview(web)

        title.font = .systemFont(ofSize: 17, weight: .semibold)
        title.alignment = .center
        title.frame = NSRect(x: 16, y: 72, width: size.width - 32, height: 26)
        container.addSubview(title)

        niceLabel.font = .systemFont(ofSize: 22, weight: .bold)
        niceLabel.alignment = .center
        niceLabel.frame = title.frame
        niceLabel.isHidden = true
        container.addSubview(niceLabel)

        yesButton.bezelStyle = .rounded
        yesButton.keyEquivalent = "\r"
        yesButton.frame = NSRect(x: 24, y: 24, width: 125, height: 34)
        yesButton.target = self
        yesButton.action = #selector(yes)
        container.addSubview(yesButton)

        laterButton.bezelStyle = .rounded
        laterButton.keyEquivalent = "\u{1b}"
        laterButton.frame = NSRect(x: size.width - 24 - 145, y: 24, width: 145, height: 34)
        laterButton.target = self
        laterButton.action = #selector(later)
        container.addSubview(laterButton)

        speaker.onWord = { [weak self] i in self?.web.wordBoundary(i) }
        speaker.onFinish = { [weak self] in self?.web.speechEnd() }
        web.onMessage = { [weak self] type in if type == "yes" { self?.yes() } }
        title.isHidden = true
    }

    var isVisible: Bool { panel.isVisible }

    func show(speak: Bool) {
        hideTimer?.invalidate()
        niceLabel.isHidden = true
        yesButton.isEnabled = true
        laterButton.isEnabled = true
        if let screen = NSScreen.main {
            let f = screen.visibleFrame
            panel.setFrameOrigin(NSPoint(x: f.maxX - panel.frame.width - 24, y: f.maxY - panel.frame.height - 24))
        }
        panel.orderFrontRegardless()
        web.ask()
        if speak { speaker.speak("Hi, do you have water?") }
    }

    @objc private func yes() {
        speaker.stop()
        web.celebrate()
        niceLabel.isHidden = false
        yesButton.isEnabled = false
        laterButton.isEnabled = false
        onYes?()
        hideTimer = Timer.scheduledTimer(withTimeInterval: 2.6, repeats: false) { [weak self] _ in self?.hide() }
    }

    @objc private func later() {
        speaker.stop()
        onLater?()
        hide()
    }

    func hide() {
        hideTimer?.invalidate()
        web.idle()
        panel.orderOut(nil)
    }
}
