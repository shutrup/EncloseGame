import XCTest
@testable import Enclose

@MainActor
final class EncloseTests: XCTestCase {
    func testBoardPresetRows() {
        XCTAssertEqual(BoardPreset.mini.rows, [1, 3, 5, 3, 1])
        XCTAssertEqual(BoardPreset.standard.rows, [1, 3, 5, 7, 5, 3, 1])
        XCTAssertEqual(BoardPreset.large.rows, [1, 3, 5, 7, 9, 7, 5, 3, 1])
    }

    func testBoardPresetZoneCounts() {
        XCTAssertEqual(GameEngine(preset: .mini).board.zones.count, 13)
        XCTAssertEqual(GameEngine(preset: .standard).board.zones.count, 25)
        XCTAssertEqual(GameEngine(preset: .large).board.zones.count, 41)
    }

    func testPlayRejectsDuplicateEdge() throws {
        let engine = GameEngine(preset: .mini)
        let edgeId = try XCTUnwrap(engine.board.edges.first?.id)

        XCTAssertTrue(engine.play(edgeId: edgeId))
        XCTAssertFalse(engine.play(edgeId: edgeId))
        XCTAssertEqual(engine.state.occupiedEdges.count, 1)
        XCTAssertEqual(engine.state.currentPlayer, .o)
    }

    func testResetChangesPresetAndClearsState() throws {
        let engine = GameEngine(preset: .mini)
        let edgeId = try XCTUnwrap(engine.board.edges.first?.id)
        XCTAssertTrue(engine.play(edgeId: edgeId))

        engine.reset(preset: .large)

        XCTAssertEqual(engine.preset, .large)
        XCTAssertEqual(engine.board.zones.count, 41)
        XCTAssertTrue(engine.state.occupiedEdges.isEmpty)
        XCTAssertEqual(engine.state.currentPlayer, .x)
    }
}
