import Foundation
import WebKit

/// Locates the shared character bundle (index.html, dist/character.bundle.js).
enum CharacterResources {
    static var directory: URL? {
        if let env = ProcessInfo.processInfo.environment["CHARACTER_DIR"], !env.isEmpty {
            return URL(fileURLWithPath: env)
        }
        if let res = Bundle.main.resourceURL?.appendingPathComponent("character"),
           FileManager.default.fileExists(atPath: res.appendingPathComponent("index.html").path) {
            return res
        }
        // Development fallback (`swift run`): walk up from the executable to the repo's character/ folder.
        var url = URL(fileURLWithPath: CommandLine.arguments[0]).resolvingSymlinksInPath()
        for _ in 0..<8 {
            url.deleteLastPathComponent()
            let candidate = url.appendingPathComponent("character")
            if FileManager.default.fileExists(atPath: candidate.appendingPathComponent("index.html").path) {
                return candidate
            }
        }
        return nil
    }
}

/// Serves the character folder over a custom scheme so fetch() works (file:// fetches are blocked by WebKit).
final class CharacterSchemeHandler: NSObject, WKURLSchemeHandler {
    static let scheme = "pixelfriend"
    private let root: URL

    init(root: URL) { self.root = root }

    func webView(_ webView: WKWebView, start task: WKURLSchemeTask) {
        guard let url = task.request.url else { return }
        var rel = url.path
        if rel.hasPrefix("/") { rel.removeFirst() }
        if rel.isEmpty { rel = "index.html" }
        let file = root.appendingPathComponent(rel)
        guard let data = FileManager.default.contents(atPath: file.path) else {
            task.didReceive(HTTPURLResponse(url: url, statusCode: 404, httpVersion: nil, headerFields: nil)!)
            task.didFinish()
            return
        }
        let mime: String
        switch file.pathExtension.lowercased() {
        case "html": mime = "text/html"
        case "js": mime = "text/javascript"
        case "css": mime = "text/css"
        case "glb": mime = "model/gltf-binary"
        case "png": mime = "image/png"
        case "json": mime = "application/json"
        default: mime = "application/octet-stream"
        }
        let response = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                       headerFields: ["Content-Type": mime, "Content-Length": String(data.count),
                                                      "Access-Control-Allow-Origin": "*"])!
        task.didReceive(response)
        task.didReceive(data)
        task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: WKURLSchemeTask) {}
}

/// A WKWebView hosting the shared 3D character engine, with helpers to drive it.
final class CharacterWebView: WKWebView {
    private(set) var isReady = false
    private var pendingScripts: [String] = []
    var onReady: (() -> Void)?
    /// Called with the `type` of every message the engine posts (e.g. "yes" when the bubble's button is tapped).
    var onMessage: ((String) -> Void)?

    init(frame: CGRect, transparent: Bool, framing: String) {
        let config = WKWebViewConfiguration()
        if let root = CharacterResources.directory {
            config.setURLSchemeHandler(CharacterSchemeHandler(root: root), forURLScheme: CharacterSchemeHandler.scheme)
        }
        let controller = WKUserContentController()
        config.userContentController = controller
        super.init(frame: frame, configuration: config)
        controller.add(MessageBridge { [weak self] type in
            guard let self else { return }
            if type == "ready" {
                self.isReady = true
                self.pendingScripts.forEach { self.evaluateJavaScript($0) }
                self.pendingScripts.removeAll()
                self.onReady?()
            }
            self.onMessage?(type)
        }, name: "character")
        if transparent {
            setValue(false, forKey: "drawsBackground")
            underPageBackgroundColor = .clear
        }
        let bg = transparent ? "transparent" : "clean"
        let url = URL(string: "\(CharacterSchemeHandler.scheme)://character/index.html?bg=\(bg)&framing=\(framing)")!
        load(URLRequest(url: url))
    }

    required init?(coder: NSCoder) { fatalError("init(coder:) is not supported") }

    func run(_ script: String) {
        if isReady { evaluateJavaScript(script) } else { pendingScripts.append(script) }
    }

    func ask() { run("PixelCharacter.setSpeech('external'); PixelCharacter.ask();") }
    func celebrate() { run("PixelCharacter.celebrate();") }
    func idle() { run("PixelCharacter.idle();") }
    func wordBoundary(_ index: Int) { run("PixelCharacter.wordBoundary(\(index));") }
    func speechEnd() { run("PixelCharacter.speechEnd();") }
}

private final class MessageBridge: NSObject, WKScriptMessageHandler {
    private let handler: (String) -> Void
    init(handler: @escaping (String) -> Void) { self.handler = handler }
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if let body = message.body as? [String: Any], let type = body["type"] as? String { handler(type) }
    }
}
