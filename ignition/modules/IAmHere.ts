// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

// need to figure out how to deploy this on localhost as well ...
const ZK_PASSPORT_VERIFIER_CONTRACT_ADDRESS = "0x8c6982D77f7a8f60aE3133cA9b2FAA6f3e78c394";

const IAmHereModule = buildModule("IAmHereModule", (m) => {
  const iAmHere = m.contract("IAmHere", [ZK_PASSPORT_VERIFIER_CONTRACT_ADDRESS]);

  console.log(iAmHere.address);

  return { iAmHere };
});

module.exports = IAmHereModule;
