// SPDX-License-Identifier: MIT
pragma solidity ^0.8.21;

enum ProofType {
  DISCLOSE,
  AGE,
  BIRTHDATE,
  EXPIRY_DATE,
  NATIONALITY_INCLUSION,
  NATIONALITY_EXCLUSION,
  ISSUING_COUNTRY_INCLUSION,
  ISSUING_COUNTRY_EXCLUSION
}

struct ProofVerificationParams {
  bytes32 vkeyHash;
  bytes proof;
  bytes32[] publicInputs;
  bytes committedInputs;
  uint256[] committedInputCounts;
  uint256 validityPeriodInDays;
  string scope;
  string subscope;
  bool devMode;
}

interface IZKPassportVerifier {
  // Verify the proof
  function verifyProof(ProofVerificationParams calldata params) external returns (bool verified, bytes32 uniqueIdentifier);
  // Get the inputs for the age proof
  function getAgeProofInputs(bytes calldata committedInputs, uint256[] calldata committedInputCounts) external view returns (uint256 currentDate, uint8 minAge, uint8 maxAge);
  // Get the inputs for the disclose proof
  function getDiscloseProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts
  ) external pure returns (bytes memory discloseMask, bytes memory discloseBytes);
  // Get the disclosed data from the proof
  function getDisclosedData(
    bytes calldata discloseBytes,
    bool isIDCard
  ) external view returns (
    string memory name,
    string memory issuingCountry,
    string memory nationality,
    string memory gender,
    string memory birthDate,
    string memory expiryDate,
    string memory documentNumber,
    string memory documentType
  );
  // Get the inputs for the nationality/issuing country inclusion and exclusion proofs
  function getCountryProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts,
    ProofType proofType
  ) external pure returns (string[] memory countryList);
  // Get the inputs for the birthdate and expiry date proofs
  function getDateProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts,
    ProofType proofType
  ) external pure returns (uint256 currentDate, uint256 minDate, uint256 maxDate);
  // Get the inputs for the bind proof
  function getBindProofInputs(
    bytes calldata committedInputs,
    uint256[] calldata committedInputCounts
  ) external pure returns (bytes memory data);
  // Get the bound data from the raw data returned by the getBindProofInputs function
  function getBoundData(bytes calldata data) external view returns (address userAddress, string memory customData);
  // Verify the scope of the proof
  function verifyScopes(bytes32[] calldata publicInputs, string calldata domain, string calldata scope) external view returns (bool);
}

contract YourContract {
    IZKPassportVerifier public zkPassportVerifier;

    // Map users to their verified unique identifiers
    mapping(address => bytes32) public userIdentifiers;

    constructor(address _verifierAddress) {
        zkPassportVerifier = IZKPassportVerifier(_verifierAddress);
    }

    function register(ProofVerificationParams calldata params, bool isIDCard) public returns (bytes32) {
        // Verify the proof
        (bool verified, bytes32 uniqueIdentifier) = zkPassportVerifier.verifyProof(params);
        require(verified, "Proof is invalid");

        // Check the proof was generated using your domain name (scope) and the subscope
        // you specified
        require(
          zkPassportVerifier.verifyScopes(params.publicInputs, "your-domain.com", "my-scope"),
          "Invalid scope"
        );

        // Get the age condition checked in the proof
        (uint256 currentDate, uint8 minAge, uint8 maxAge) = zkPassportVerifier.getAgeProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Make sure the date used for the proof makes sense
        require(block.timestamp >= currentDate, "Date used in proof is in the future");
        // This is the condition for checking the age is 18 or above
        // Max age is set to 0 and therefore ignored in the proof, so it's equivalent to no upper limit
        // Min age is set to 18, so the user needs to be at least 18 years old
        require(minAge == 18 && maxAge == 0, "User needs to be above 18");

        // Get the disclosed bytes of data from the proof
        (, bytes memory disclosedBytes) = zkPassportVerifier.getDiscloseProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Get the nationality from the disclosed data and ignore the rest
        // Passing the disclosed bytes returned by the previous function
        // this function will format it for you so you can use the data you need
        (, , string memory nationality, , , , , ) = zkPassportVerifier.getDisclosedData(
          disclosedBytes,
          isIDCard
        );


        // Get the raw data bound to the proof
        // This is the data you bound to the proof using the bind method in the query builder
        bytes memory data = zkPassportVerifier.getBindProofInputs(
          params.committedInputs,
          params.committedInputCounts
        );
        // Use the getBoundData function to get the formatted data
        // which includes the user's address and any custom data
        (address userAddress, ) = zkPassportVerifier.getBoundData(data);
        // Make sure the user's address is the one that is calling the contract
        require(userAddress == msg.sender, "Not the expected sender");
        // If you didn't specify any custom data, make sure the string is empty
        // require(bytes(customData).length == 0, "Custom data should be empty");

        // Store the unique identifier
        userIdentifiers[msg.sender] = uniqueIdentifier;

        return uniqueIdentifier;
    }

    // Your contract functionality using the verification
    function restrictedFunction() public view {
        require(userIdentifiers[msg.sender] != bytes32(0), "Not verified");
        // Function logic for verified users
    }
}