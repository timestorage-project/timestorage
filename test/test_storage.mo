import Storage "../src/timestorage_backend/storage";
import Debug "mo:base/Debug";

module {
    public func testNewUUIDStructure() {
        let structure = Storage.newUUIDStructure();
        assert structure.size() == 0;
        Debug.print("testNewUUIDStructure: Passed");
    };

    public func testNewFileMap() {
        let fileMap = Storage.newFileMap();
        assert fileMap.size() == 0;
        Debug.print("testNewFileMap: Passed");
    };

    public func testNewUUIDKeyValueMap() {
        let keyValueMap = Storage.newUUIDKeyValueMap();
        assert keyValueMap.size() == 0;
        Debug.print("testNewUUIDKeyValueMap: Passed");
    };

    public func testNewValueLockMap() {
        let valueLockMap = Storage.newValueLockMap();
        assert valueLockMap.size() == 0;
        Debug.print("testNewValueLockMap: Passed");
    };

    public func testMakeLockKey() {
        let lockKey = Storage.makeLockKey("uuid-1", "key1");
        assert lockKey == "uuid-1|key1";
        Debug.print("testMakeLockKey: Passed");
    };

    public func runAllTests() {
        testNewUUIDStructure();
        testNewFileMap();
        testNewUUIDKeyValueMap();
        testNewValueLockMap();
        testMakeLockKey();
        Debug.print("All storage tests passed!");
    };
};
