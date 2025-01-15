import TestStorage "./test_storage";
import TestUtils "./test_utils";
import TestMain "./test_main";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import TestLogic "test_logic";
import TestAuth "test_auth";

actor TestRunner {

    // Function to run all tests
    public func runAllTests() : async Text {
        //let deployerPrincipal = Principal.fromText(""); // Principal di chi fa il deploy di timestorage_backend (da impostare per test_main dato che si collega direttamente a timestorage_backend)
        let deployerPrincipal = Principal.fromActor(TestRunner); // Ottieni il Principal di chi fa il deploy di test_runner

        Debug.print("Running auth tests...");
        TestAuth.runAllTests(deployerPrincipal);

        Debug.print("Running logic tests...");
        TestLogic.runAllTests(deployerPrincipal);

        Debug.print("Running storage tests...");
        TestStorage.runAllTests();

        Debug.print("Running utils tests...");
        TestUtils.runAllTests();

        Debug.print("Running main tests...");
        await TestMain.runAllTests(deployerPrincipal);

        Debug.print("All tests completed!");
        return "All tests passed!";
    };
};