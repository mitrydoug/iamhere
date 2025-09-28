import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";
import { ZKPassport } from "@zkpassport/sdk";

describe("IAmHere", function () {

  async function deployFixture() {
    // Get the ContractFactory and Signers here.

    const zkPassport = new ZKPassport("mitrydoug.github.io");

    const {
      // The address of the deployed verifier contract
      address,
    } = zkPassport.getSolidityVerifierDetails("ethereum_sepolia");


    const iAmHere = await hre.ethers.deployContract("IAmHere", [address]);
    const [owner, addr1, addr2] = await hre.ethers.getSigners();

    // Fixtures can return anything you consider useful for your tests
    return { iAmHere, owner, addr1, addr2 };
  }
  
  it("Should deploy contract", async function () {
    const { iAmHere } = await loadFixture(deployFixture);
  });
});
