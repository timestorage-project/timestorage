import Storage "../src/timestorage_backend/storage";
import Debug "mo:base/Debug";

module {

    // Test for newUUIDStructure function
    public func testNewUUIDStructure() {
        let structure = Storage.newUUIDStructure();
        assert structure.size() == 0;
        Debug.print("testNewUUIDStructure: Passed");
    };

    // Test for newFileMap function
    public func testNewFileMap() {
        let fileMap = Storage.newFileMap();
        assert fileMap.size() == 0;
        Debug.print("testNewFileMap: Passed");
    };

    // Test for newUUIDKeyValueMap function
    public func testNewUUIDKeyValueMap() {
        let keyValueMap = Storage.newUUIDKeyValueMap();
        assert keyValueMap.size() == 0;
        Debug.print("testNewUUIDKeyValueMap: Passed");
    };

    // Test for newValueLockMap function
    public func testNewValueLockMap() {
        let valueLockMap = Storage.newValueLockMap();
        assert valueLockMap.size() == 0;
        Debug.print("testNewValueLockMap: Passed");
    };

    // Test for makeLockKey function
    public func testMakeLockKey() {
        let lockKey = Storage.makeLockKey("uuid-1", "key1");
        assert lockKey == "uuid-1|key1";
        Debug.print("testMakeLockKey: Passed");
    };

    // Run all storage tests
    public func runAllTests() {
        testNewUUIDStructure();
        testNewFileMap();
        testNewUUIDKeyValueMap();
        testNewValueLockMap();
        testMakeLockKey();
        Debug.print("All storage tests passed!");
    };
};