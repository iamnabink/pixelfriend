import AppKit

struct AvatarColors {
    var shirt: NSColor
    var hair: NSColor
    var skin: NSColor
    var pants: NSColor

    static let standard = AvatarColors(
        shirt: NSColor(hex: "#4FB3FF")!, hair: NSColor(hex: "#5A3825")!,
        skin: NSColor(hex: "#F5C9A6")!, pants: NSColor(hex: "#3B4A6B")!)
}

extension NSColor {
    convenience init?(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespaces)
        if s.hasPrefix("#") { s = String(s.dropFirst()) }
        guard s.count == 6, let v = UInt32(s, radix: 16) else { return nil }
        self.init(srgbRed: CGFloat((v >> 16) & 0xff) / 255, green: CGFloat((v >> 8) & 0xff) / 255,
                  blue: CGFloat(v & 0xff) / 255, alpha: 1)
    }
}

/// Same 12x16 text-art frames as the VS Code webview, so both buddies look identical.
enum PixelArt {
    static let width = 12
    static let height = 16

    static let walk: [[String]] = [
        ["....hhhh....", "...hhhhhh...", "...hhssss...", "...hsesse...", "...sssss....", "....ssss....",
         "..bbbbbbbb..", ".sbbbbbbbbs.", ".sbbbbbbbbs.", "..bbbbbbbb..", "...pppppp...", "...ppp.ppp..",
         "...pp...pp..", "...pp...pp..", "..kkk...kkk.", "............"],
        ["....hhhh....", "...hhhhhh...", "...hhssss...", "...hsesse...", "...sssss....", "....ssss....",
         "..bbbbbbbb..", ".sbbbbbbbb..", "..bbbbbbbbs.", "..bbbbbbbb..", "...pppppp...", "..ppp..ppp..",
         ".pp......pp.", ".pp......pp.", "kkk......kkk", "............"],
        ["............", "....hhhh....", "...hhhhhh...", "...hhssss...", "...hsesse...", "...sssss....",
         "....ssss....", "..bbbbbbbb..", ".sbbbbbbbbs.", ".sbbbbbbbbs.", "..bbbbbbbb..", "...pppppp...",
         "...pppppp...", "...pp.pp....", "...pp.pp....", "..kkk.kkk..."],
        ["....hhhh....", "...hhhhhh...", "...hhssss...", "...hsesse...", "...sssss....", "....ssss....",
         "..bbbbbbbb..", "..bbbbbbbbs.", ".sbbbbbbbb..", "..bbbbbbbb..", "...pppppp...", "..ppp..ppp..",
         ".pp......pp.", ".pp......pp.", "kkk......kkk", "............"],
    ]

    static let wave: [[String]] = [
        ["....hhhh...s", "...hhhhhh..s", "...hhssss..s", "...hsesse..s", "...smmss..bs", "....ssss..b.",
         "..bbbbbbbbb.", ".sbbbbbbbb..", ".sbbbbbbbb..", "..bbbbbbbb..", "...pppppp...", "...ppp.ppp..",
         "...pp...pp..", "...pp...pp..", "..kkk...kkk.", "............"],
        ["....hhhh..s.", "...hhhhhh.s.", "...hhssss.s.", "...hsessebs.", "...smmss.b..", "....ssss.b..",
         "..bbbbbbbbb.", ".sbbbbbbbb..", ".sbbbbbbbb..", "..bbbbbbbb..", "...pppppp...", "...ppp.ppp..",
         "...pp...pp..", "...pp...pp..", "..kkk...kkk.", "............"],
    ]

    private static let danceA: [String] = [
        "s...hhhh...s", "s..hhhhhh..s", "s..hhssss..s", "b..hsesse..b", "b..smmss...b", ".b..ssss..b.",
        "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "...pppppp...", "...ppp.ppp..",
        "...pp...pp..", "...pp...pp..", "..kkk...kkk.", "............"]
    private static let danceB: [String] = [
        "............", "s...hhhh...s", "s..hhhhhh..s", "s..hhssss..s", "b..hsesse..b", "b..smmss...b",
        ".b..ssss..b.", "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "...pppppp...",
        "..ppp..ppp..", ".pp......pp.", "kkk......kkk", "............"]
    private static let danceC: [String] = [
        "..s.hhhh.s..", "..shhhhhhs..", "...hhssss...", "..bhsesseb..", "...smmss....", "....ssss....",
        "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "..bbbbbbbb..", "...pppppp...", "...ppp.ppp..",
        "...pp...pp..", "...pp...pp..", "..kkk...kkk.", "............"]

    static var dance: [[String]] { [danceA, danceB, danceC, mirror(danceB)] }

    static func mirror(_ frame: [String]) -> [String] { frame.map { String($0.reversed()) } }

    static func render(_ frame: [String], colors: AvatarColors, scale: CGFloat) -> NSImage {
        let size = NSSize(width: CGFloat(width) * scale, height: CGFloat(height) * scale)
        let image = NSImage(size: size)
        image.lockFocusFlipped(true)
        for (y, row) in frame.enumerated() {
            for (x, ch) in row.enumerated() {
                guard let color = color(for: ch, colors) else { continue }
                color.setFill()
                NSRect(x: CGFloat(x) * scale, y: CGFloat(y) * scale, width: scale, height: scale).fill()
            }
        }
        image.unlockFocus()
        return image
    }

    private static func color(for ch: Character, _ c: AvatarColors) -> NSColor? {
        switch ch {
        case "h": return c.hair
        case "s": return c.skin
        case "e": return NSColor(hex: "#1f1f1f")
        case "m": return NSColor(hex: "#c07a5e")
        case "b": return c.shirt
        case "p": return c.pants
        case "k": return NSColor(hex: "#2b2b2b")
        default: return nil
        }
    }
}

/// Pre-rendered frames for the three animations. Frames face right.
struct SpriteSet {
    let walk: [NSImage]
    let wave: [NSImage]
    let dance: [NSImage]
    let fps: Double
    let isCustom: Bool
    var size: NSSize { walk.first?.size ?? NSSize(width: 48, height: 64) }

    static func builtIn(colors: AvatarColors, scale: CGFloat) -> SpriteSet {
        SpriteSet(
            walk: PixelArt.walk.map { PixelArt.render($0, colors: colors, scale: scale) },
            wave: PixelArt.wave.map { PixelArt.render($0, colors: colors, scale: scale) },
            dance: PixelArt.dance.map { PixelArt.render($0, colors: colors, scale: scale) },
            fps: 8, isCustom: false)
    }

    /// Slices a 3-row sheet (walk / wave / dance). Returns nil when the file cannot be read.
    static func sheet(at path: String, config: SpriteConfig, scale: CGFloat) -> SpriteSet? {
        guard let image = NSImage(contentsOfFile: path), let rep = image.representations.first else { return nil }
        image.size = NSSize(width: rep.pixelsWide, height: rep.pixelsHigh) // 1 point == 1 pixel
        let fw = CGFloat(config.frameWidth), fh = CGFloat(config.frameHeight)
        let out = NSSize(width: fw * scale, height: fh * scale)
        func row(_ r: Int, _ count: Int) -> [NSImage] {
            (0..<max(1, count)).map { i in
                let src = NSRect(x: CGFloat(i) * fw, y: image.size.height - CGFloat(r + 1) * fh, width: fw, height: fh)
                let frame = NSImage(size: out)
                frame.lockFocus()
                NSGraphicsContext.current?.imageInterpolation = .none
                image.draw(in: NSRect(origin: .zero, size: out), from: src, operation: .sourceOver, fraction: 1)
                frame.unlockFocus()
                return frame
            }
        }
        return SpriteSet(walk: row(0, config.walkFrames), wave: row(1, config.waveFrames),
                         dance: row(2, config.danceFrames), fps: Double(max(1, config.fps)), isCustom: true)
    }
}
