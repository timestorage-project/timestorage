#!/bin/bash

# Start dfx in the background
dfx start --background

# Wait a few seconds for dfx to start properly
sleep 5

dfx deploy

# Insert the UUID structure
dfx canister call timestorage_backend insertUUIDStructure '( "uuid-dummy", "{ \"key1\": \"value1\", \"key2\": \"value2\" }" )'