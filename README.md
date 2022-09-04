# template-challenge-staking
Contracts with missing implementation details and unit tests to help guide junior solidity developers.

# Getting started
1) Open the terminal at the root directory.
2) Run the following command: npm i.
3) Wait for the packages to install.
4) Run the following command: npm test.
5) The entire test suite should run, many of the tests should fail.

# Project
The contracts can be found within the "contracts" folder.
The tests can be found within the "test" folder.

The contracts used within the tests can be found within the "contracts/test" folder. These can be safely ignored.

# Help
Hello dear developer, thank you for giving this challenge a go.
My advice to you would be to first understand the hierarchy of the contracts.
Once you do, make your way from the bottom up and read the tests for each contract. 
when you understand the requirements dictated by the tests, open the associated solidity contract and fill in the implementation detail until all of the tests pass.
Lastly, move up the heirachy to the next contract and repeat until the entire suite passes.

If you get stuck, feel free to message me @BuiltByFrancis on twitter. I will be happy to help.

# OpenZeppelin
I have chosen to use OpenZeppelin as it is one of the most common libraries and you are sure to come across it in your development journey.
Feel free to use any of the contracts provided by the library in order to satisfy the implementation details.

# Disclaimer
The tests are written with the assumption that the structure of the code within the contracts folder remains untouched. There is no guarentee that the test suite will function as expected should function signatures or contract inheritance hierarchies be changed. Do so only if you know what you are doing.

# Improvements / Extensions
General (Easy):
    - I have explicitly removed all code comments for this challenge, so:
        - add contract level comments
        - add function level comments
        - add implementation detail comments where applicable. (Dont over do it)

StakedNFT (Medium):
    - I have ommited the code required to return a URI containing meta data for this contract.
        - Add the code
        - Test the code

TokenEmitter (Hard):
    - In a large collection setting up the "tokenRewardRateIndex" mapping would cost a huge amount of gas. Find an alternative method such as a merkle tree.
        - Note: The use of a merkle tree will require the changing of several function signatures. Fix the tests alongside development.
