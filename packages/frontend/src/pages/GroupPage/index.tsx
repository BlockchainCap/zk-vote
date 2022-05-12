import { Suspense, useState } from "react";
import { Button, Container } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { Strategy, ZkIdentity } from "@zk-kit/identity";
import { BigNumber, ethers, Event } from "ethers";
import {
  createExternalNullifier,
  getNullHashAndProofForMessage,
  broadcastMessage,
  Proof,
} from "../../zk/zkLib";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";

import { Proposal } from "../../components/Proposal";
import { useEventListener } from "../../hooks/useEventListener";
import {
  ZKVote,
  ZKVote__factory,
  ERC721__factory,
  ERC721,
} from "../../generated";
import { CreateProposalModal } from "../../components/CreateProposalModal";
import { useReadBalance } from "../../hooks/useReadNFTBalance";
import { RegistrationFlow } from "../../components/RegistrationFlow";
import { useReadNFTData } from "../../hooks/useReadNFTData";
import { ZKVoteNFT } from "../../generated/ZKVoteNFT";
import { ZKVoteNFT__factory } from "../../generated/factories/ZKVoteNFT__factory";

export const GroupPage = () => {
  const { groupId } = useParams();
  const [registerErr, setRegErr] = useState();
  const navigate = useNavigate();
  const provider = useProvider();
  const signer = useSigner();
  const account = useAccount();
  const zkVoteContract: ZKVote = useContract({
    addressOrName: "0x40D06FB96d75f361A325db5fb90568eDAd82fC3C",
    contractInterface: ZKVote__factory.abi,
    signerOrProvider: provider,
  });

  const nftContract: ZKVoteNFT = useContract({
    addressOrName: "0x4215edb99e120a0A35FECe311f72DA65D5D00941",
    contractInterface: ZKVoteNFT__factory.abi,
    signerOrProvider: provider,
  })!;

  const dynamicContract: ERC721 = useContract({
    addressOrName: groupId!,
    contractInterface: ERC721__factory.abi,
    signerOrProvider: provider,
  })!;
  const balanceOfUser = useReadBalance(account.data?.address, dynamicContract);

  const [messagesBroadcasted]: any[] = useEventListener(
    zkVoteContract,
    "CreateProposal",
    0
  )!;

  const proposalsForGroup: any[] = messagesBroadcasted!.filter(
    (message: Event) => message!.args![0] === groupId
  )!;
  const [members]: any[] = useEventListener(zkVoteContract, "Register", 0);
  const identityCommitmentsOnChain: any[] = members!.map(
    (member: Event) => member!.args![3]
  );
  const hasMinted: boolean = BigNumber.from(balanceOfUser).gt(
    BigNumber.from(0)
  );
  const isMember: boolean =
    members!.filter(
      (member: Event) =>
        member!.args![2] === account.data?.address &&
        member!.args![0] === groupId
    ).length > 0;

  const createProposalProof = async (
    proposalMessage: string
  ): Promise<Proof> => {
    const clubId = await zkVoteContract.clubs(groupId!);
    const messageBytes = ethers.utils.formatBytes32String(proposalMessage);
    const window = BigNumber.from(
      Math.round((await signer!.data!.provider?.getBlockNumber())!)
    ).div(1000);
    const externalNullifier = createExternalNullifier(
      clubId,
      BigNumber.from(0),
      window
    );

    const message = await signer!.data!.signMessage(
      "Sign this message to create your identity!"
    );
    const identity = new ZkIdentity(Strategy.MESSAGE, message);

    const { nullifierHash, solidityProof, root } =
      await getNullHashAndProofForMessage(
        proposalMessage,
        externalNullifier,
        identity.genIdentityCommitment(),
        identityCommitmentsOnChain,
        identity
      );

    return {
      messageBytes: messageBytes,
      token: groupId!,
      nullifierHash: nullifierHash,
      root: root,
      externalNullifier: externalNullifier,
      clubId: clubId,
      messageType: BigNumber.from(0),
      flexField: window,
      proof: solidityProof,
    };
  };
  const broadcastProof = async (proof: Proof) => {
    await broadcastMessage(zkVoteContract.connect(signer.data!), proof);
  };
  const mint = async () => {
    await nftContract.connect(signer.data!).mintItem(account.data?.address!);
  };
  const registerId = async () => {
    setRegErr(undefined);
    const message = await signer!.data!.signMessage(
      "Sign this message to create your identity!"
    );
    const identity = new ZkIdentity(Strategy.MESSAGE, message);
    const identityCommitment = identity.genIdentityCommitment();
    const addy = account.data?.address;

    try {
      const tokenId = await nftContract.tokenOfOwnerByIndex(addy!, 0);
      await zkVoteContract
        .connect(signer.data!)
        .registerIdentity(groupId!, tokenId, identityCommitment);
      // pass to notify
    } catch (err: any) {
      console.error(err);
      setRegErr(err.data.message);
    }
  };
  const { name, symbol } = useReadNFTData(dynamicContract);
  return (
    <Suspense fallback={<>error</>}>
      <Container>
        <Button variant="" onClick={() => navigate("/")}>
          {"Back"}
        </Button>
        <h3>
          Proposals for group:{" "}
          {name && symbol ? name + " - $" + symbol : groupId}
        </h3>
        <RegistrationFlow
          groupId={groupId}
          hasMinted={hasMinted}
          isMember={isMember}
          isConnected={!!account.data?.address}
        />
        <CreateProposalModal
          createProposal={createProposalProof}
          submitProof={broadcastProof}
          isMember={isMember}
          hasMinted={hasMinted}
          register={registerId}
          mint={mint}
          isConnected={signer.data != null}
          isExampleNFT={groupId === nftContract.address}
        />
        {registerErr ?? ""}

        {proposalsForGroup.map((message, i) => (
          <Proposal
            key={i}
            message={ethers.utils.parseBytes32String(message.args[2])}
            proposalId={message.args[3]}
          />
        ))}
      </Container>
    </Suspense>
  );
};
