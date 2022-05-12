import '../helpers/hardhat-imports';
import './helpers/chai-imports';

import { expect } from 'chai';
import { ZKVoteNFT, ZKVoteNFT__factory } from 'generated/contract-types';
import hre from 'hardhat';
import { getHardhatSigners } from 'tasks/functions/accounts';


describe('Simple NFT Example', function () {
  this.timeout(180000);

  // console.log("hre:",Object.keys(hre)) // <-- you can access the hardhat runtime env here

  describe('YourNFT', function () {
    let zkVoteNFTContract: ZKVoteNFT;

    before(async () => {
      const { deployer } = await getHardhatSigners(hre);
      const factory = new ZKVoteNFT__factory(deployer);
      zkVoteNFTContract = await factory.deploy();
    });

    beforeEach(async () => {
      // put stuff you need to run before each test here
    });

    describe('mintItem()', function () {
      it('Should be able to mint an NFT', async function () {
        const { user1 } = await getHardhatSigners(hre);

        const startingBalance = await zkVoteNFTContract.balanceOf(user1.address);
        const mintResult = await zkVoteNFTContract.mintItem(user1.address);
        const txResult = await mintResult.wait(1);
        expect(txResult.status).to.equal(1);
        expect(await zkVoteNFTContract.balanceOf(user1.address)).to.equal(startingBalance.add(1));
      });
    });
  });
});
