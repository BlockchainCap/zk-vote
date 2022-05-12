import { abi as ERC721_ABI, bytecode as ERC721_BYTECODE } from '@openzeppelin/contracts/build/contracts/ERC721PresetMinterPauserAutoId.json';
import { Strategy, ZkIdentity } from '@zk-kit/identity';
import { generateMerkleProof, Semaphore, StrBigInt } from '@zk-kit/protocols';
import { expect } from 'chai';
import { deployContract } from 'ethereum-waffle';
import { Signer, Contract } from 'ethers';
import { solidityPack } from 'ethers/lib/utils';
import { ethers } from 'hardhat';
import { SignerWithAddress } from 'hardhat-deploy-ethers/signers';

const PROPOSAL = BigInt(0);
const VOTE = BigInt(1);
const deployZkClub = async (): Promise<Contract> => {
  const VerifierContract = await ethers.getContractFactory('Verifier');
  const verifier = await VerifierContract.deploy();
  await verifier.deployed();
  const Poseiden = await ethers.getContractFactory('PoseidonT3');
  const poseidon = await Poseiden.deploy();
  await poseidon.deployed();
  const IncrementalTree = await ethers.getContractFactory('IncrementalBinaryTree', {
    libraries: {
      PoseidonT3: poseidon.address,
    },
  });
  const incrTree = await IncrementalTree.deploy();
  await incrTree.deployed();
  const ZKClub = await ethers.getContractFactory('ZKVote', {
    libraries: {
      IncrementalBinaryTree: incrTree.address,
    },
  });
  const zkClub = await ZKClub.deploy(verifier.address);
  await zkClub.deployed();

  return zkClub;
};

describe('ZKVote test suite', function () {
  let contract: Contract;
  let signers: SignerWithAddress[];
  let token: Contract;
  let nftDeployer: SignerWithAddress;
  let actor2: SignerWithAddress;
  let proposalExternalNullifier: BigInt;

  before(async () => {
    contract = await deployZkClub();
    signers = await ethers.getSigners();
    nftDeployer = signers[0];
    actor2 = signers[1];
    token = await deployContract(nftDeployer, { bytecode: ERC721_BYTECODE, abi: ERC721_ABI }, ['ExampleClubToken', 'ZKVote', 'url.ignore']);
  });

  describe('# full registration and broadcast integration test', () => {
    const wasmFilePath = './static/semaphore.wasm';
    const finalZkeyPath = './static/semaphore_final.zkey';
    let identityCommitments: StrBigInt[];
    let identities: ZkIdentity[];
    let tokenId: string;
    it('# should create the club', async () => {
      const { identity, identityCommitment } = await getIdentityCommitmentForSigner(signers[0]);
      // const { identityCommitment: identityCommitment2 } =
      //   await getIdentityCommitmentForSigner(signers[1]);

      identityCommitments = [identityCommitment];
      identities = [identity];
      const createClubTransaction = await contract.createClub(token.address);
      await expect(createClubTransaction).to.emit(contract, 'CreateClub').withArgs(token.address, 1);

      await token.connect(nftDeployer).mint(nftDeployer.address);
      await token.connect(nftDeployer).mint(actor2.address);
      tokenId = await token.tokenOfOwnerByIndex(nftDeployer.address, 0);
      // tokenId2 = await token.tokenOfOwnerByIndex(actor2.address, 0);
    });
    it('# should join club', async () => {
      const registerTransaction = contract.connect(nftDeployer).registerIdentity(token.address, tokenId, identityCommitments[0]);
      await expect(registerTransaction).to.emit(contract, 'Register').withArgs(token.address, tokenId, nftDeployer.address, identityCommitments[0]);
    });
    it('# should create a proposal', async () => {
      const clubId = await contract.clubs(token.address);
      const messageToBroadcast = 'TEST MESSAGE';
      const messageBytes = ethers.utils.formatBytes32String(messageToBroadcast);
      const identityCommitmentsOnChain = await getAllIdentityCommitments(contract);
      const window = BigInt(Math.round((await ethers.provider.getBlockNumber()) / 1000));
      const externalNullifier = createExternalNullifier(clubId, PROPOSAL, window);
      const { nullifierHash, solidityProof, root } = await getNullHashAndProofForMessage(
        messageToBroadcast,
        externalNullifier,
        identityCommitments[0],
        identityCommitmentsOnChain,
        identities[0],
        wasmFilePath,
        finalZkeyPath
      );
      const broadcastTransaction = contract.broadcastMessage(
        messageBytes,
        token.address,
        nullifierHash,
        root,
        externalNullifier,
        clubId,
        PROPOSAL,
        window,
        solidityProof
      );

      await expect(broadcastTransaction).to.emit(contract, 'CreateProposal').withArgs(token.address, clubId, messageBytes, BigInt(1));
    });
    it('# should fail to create an identical proposal', async () => {
      const { identity, identityCommitment } = await getIdentityCommitmentForSigner(signers[0]);
      const clubId = await contract.clubs(token.address);
      const messageToBroadcast = 'sadf';
      const messageBytes = ethers.utils.formatBytes32String(messageToBroadcast);
      const identityCommitments = await getAllIdentityCommitments(contract);

      const window = BigInt(Math.round((await ethers.provider.getBlockNumber()) / 1000));
      const externalNullifier = createExternalNullifier(clubId, PROPOSAL, window);
      const { nullifierHash, solidityProof, root } = await getNullHashAndProofForMessage(
        messageToBroadcast,
        externalNullifier,
        identityCommitment,
        identityCommitments,
        identity,
        wasmFilePath,
        finalZkeyPath
      );
      const broadcastTransaction = contract.broadcastMessage(
        messageBytes,
        token.address,
        nullifierHash,
        root,
        externalNullifier,
        clubId,
        PROPOSAL,
        window,
        solidityProof
      );

      await expect(broadcastTransaction).to.be.revertedWith('SemaphoreCore: you cannot use the same nullifier twice');
    });
    it('# should vote on a proposal', async () => {
      const { identity, identityCommitment } = await getIdentityCommitmentForSigner(signers[0]);
      const clubId = await contract.clubs(token.address);
      const identityCommitments = await getAllIdentityCommitments(contract);
      const messageToBroadcast = 'YES';
      const messageBytes = ethers.utils.formatBytes32String(messageToBroadcast);
      const externalNullifier = createExternalNullifier(clubId, VOTE, BigInt(1));
      const { nullifierHash, solidityProof, root } = await getNullHashAndProofForMessage(
        messageToBroadcast,
        externalNullifier,
        identityCommitment,
        identityCommitments,
        identity,
        wasmFilePath,
        finalZkeyPath
      );
      const broadcastTransaction = contract
        .connect(signers[1])
        .broadcastMessage(messageBytes, token.address, nullifierHash, root, externalNullifier, clubId, VOTE, BigInt(1), solidityProof);

      await expect(broadcastTransaction).to.emit(contract, 'CastVote').withArgs(token.address, clubId, messageBytes, BigInt(1), externalNullifier);
    });
    it('# should fail to double vote', async () => {
      const { identity, identityCommitment } = await getIdentityCommitmentForSigner(signers[0]);
      const clubId = await contract.clubs(token.address);
      const identityCommitments = await getAllIdentityCommitments(contract);
      const messageToBroadcast = 'YES';
      const messageBytes = ethers.utils.formatBytes32String(messageToBroadcast);
      const externalNullifier = createExternalNullifier(clubId, VOTE, BigInt(1));
      const { nullifierHash, solidityProof, root } = await getNullHashAndProofForMessage(
        messageToBroadcast,
        externalNullifier,
        identityCommitment,
        identityCommitments,
        identity,
        wasmFilePath,
        finalZkeyPath
      );
      const broadcastTransaction = contract
        .connect(signers[1])
        .broadcastMessage(messageBytes, token.address, nullifierHash, root, externalNullifier, clubId, VOTE, BigInt(1), solidityProof);

      await expect(broadcastTransaction).to.revertedWith('SemaphoreCore: you cannot use the same nullifier twice');
    });
  });
});

const createExternalNullifier = (clubId: BigInt, messageType: BigInt, flex: BigInt) => {
  const externalNullifier = BigInt(ethers.utils.keccak256(solidityPack(['uint', 'uint8', 'uint'], [clubId, messageType, flex]))) >> BigInt(8);
  return externalNullifier;
};
const getIdentityCommitmentForSigner = async (signer: Signer) => {
  const message = await signer.signMessage('Sign this message to create your identity!');
  const identity = new ZkIdentity(Strategy.MESSAGE, message);
  const identityCommitment = identity.genIdentityCommitment();
  return { identity, identityCommitment };
};

const getNullHashAndProofForMessage = async (
  message: string,
  externalNullifier: StrBigInt,
  identityCommitment: StrBigInt,
  identityCommitments: StrBigInt[],
  identity: ZkIdentity,
  wasmFilePath: string,
  finalZkeyPath: string
) => {
  const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment);
  const witness = Semaphore.genWitness(identity.getTrapdoor(), identity.getNullifier(), merkleProof, externalNullifier, message);

  const fullProof = await Semaphore.genProof(witness, wasmFilePath, finalZkeyPath);
  const solidityProof = Semaphore.packToSolidityProof(fullProof.proof);

  const nullifierHash = Semaphore.genNullifierHash(externalNullifier, identity.getNullifier());

  return {
    nullifierHash,
    solidityProof,
    root: merkleProof.root,
  };
};

const getAllIdentityCommitments = async (contract: Contract) => {
  const events = await contract.queryFilter(contract.filters.Register());
  const identityCommits = events.map((e) => e.args!.identityCommitment.toString() as StrBigInt);
  return identityCommits;
};
