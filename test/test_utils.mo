import Utils "../src/timestorage_backend/utils";
import Debug "mo:base/Debug";

module {

    // Test for mapEntriesToJson
    public func testMapEntriesToJson() {
        let entries = [("key1", "value1"), ("key2", "value2")];
        let json = Utils.mapEntriesToJson(entries);
        assert json == "{\"key1\":\"value1\",\"key2\":\"value2\"}";
        Debug.print("testMapEntriesToJson: Passed");
    };

    // Test for escapeString function | Commented out because escapeString is private
    /*
    public func testEscapeString() {
        let escaped = Utils.escapeString("Hello\nWorld");
        assert escaped == "Hello\\nWorld";
        Debug.print("testEscapeString: Passed");
    };*/

    // Test for arrayToText
    public func testArrayToText() {
        let arr = ["a", "b", "c"];
        let result = Utils.arrayToText(arr, ", ");
        assert result == "a, b, c";
        Debug.print("testArrayToText: Passed");
    };

    // Run all utils tests
    public func runAllTests() {
        testMapEntriesToJson();
        //testEscapeString();
        testArrayToText();
        Debug.print("All utils tests passed!");
    };
};
