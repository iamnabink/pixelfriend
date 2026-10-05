// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "Activ",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "Activ",
            path: "Sources/Activ"
        )
    ]
)
