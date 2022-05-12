import { ZkIdentity } from "@zk-kit/identity";
import { StrBigInt, generateMerkleProof, Semaphore } from "@zk-kit/protocols";
import { BigNumber, ethers, BigNumberish, Contract } from "ethers";
import { solidityPack } from "ethers/lib/utils";
const wasmFilePath = process.env.PUBLIC_URL + "/static/semaphore.wasm";
const finalZkeyPath = process.env.PUBLIC_URL + "/static/semaphore_final.zkey";
export const getNullHashAndProofForMessage = async (
  message: string,
  externalNullifier: StrBigInt,
  identityCommitment: StrBigInt,
  identityCommitments: StrBigInt[],
  identity: ZkIdentity,
) => {
  const merkleProof = generateMerkleProof(
    20,
    BigInt(0),
    identityCommitments,
    identityCommitment
  );
  const witness = Semaphore.genWitness(
    identity.getTrapdoor(),
    identity.getNullifier(),
    merkleProof,
    externalNullifier,
    message
  );

  const fullProof = await Semaphore.genProof(
    witness,
    wasmFilePath,
    finalZkeyPath
  );
  const solidityProof = Semaphore.packToSolidityProof(fullProof.proof);
  const nullifierHash = Semaphore.genNullifierHash(
    externalNullifier,
    identity.getNullifier()
  );
  return {
    nullifierHash,
    solidityProof,
    root: merkleProof.root,
  };
};

export const createExternalNullifier = (
  clubId: BigNumber,
  messageType: BigNumber,
  flex: BigNumber
) => {
  const externalNullifier =
    BigInt(
      ethers.utils.keccak256(
        solidityPack(["uint", "uint8", "uint"], [clubId, messageType, flex])
      )
    ) >> BigInt(8);
  return externalNullifier;
};

// actually should be public things
export interface Proof {
  messageBytes: string;
  token: string;
  nullifierHash: BigNumberish;
  root: BigNumber;
  externalNullifier: BigNumberish;
  clubId: BigNumber;
  messageType: BigNumber;
  flexField: BigNumberish;
  proof: BigNumberish[];
}
export const broadcastMessage = (contract: Contract, proof: Proof) => {
  return contract.broadcastMessage(
    proof.messageBytes,
    proof.token,
    proof.nullifierHash,
    proof.root,
    proof.externalNullifier,
    proof.clubId,
    proof.messageType,
    proof.flexField,
    proof.proof
  );
};
