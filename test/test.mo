import TestAuth "test_auth";
import TestStorage "test_storage";
import TestUtils "test_utils";
import TestLogic "test_logic";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

actor TestRunner {
    public func runAllTests() : async Text {
        // Il deployer è ottenuto dal Principal dell'attore TestRunner
        let deployerPrincipal = Principal.fromActor(TestRunner);

        Debug.print("Running auth tests...");
        TestAuth.runAllTests(deployerPrincipal);

        Debug.print("Running storage tests...");
        TestStorage.runAllTests();

        Debug.print("Running utils tests...");
        TestUtils.runAllTests();

        Debug.print("Running logic tests...");
        TestLogic.runAllTests(deployerPrincipal);

        Debug.print("All tests completed!");
        return "All tests passed!";
    };
};
