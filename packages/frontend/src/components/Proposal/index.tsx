/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { ZkIdentity, Strategy } from "@zk-kit/identity";
import { StrBigInt } from "@zk-kit/protocols";
import { ethers, BigNumber } from "ethers";
import { Card } from "react-bootstrap";
import ReactMarkdown from "react-markdown";
import { useParams } from "react-router-dom";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { gruvboxDark } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { useContract, useProvider, useSigner } from "wagmi";
import { ZKVote, ZKVote__factory } from "../../generated";
import { useEventListener } from "../../hooks/useEventListener";
import {
  broadcastMessage,
  createExternalNullifier,
  getNullHashAndProofForMessage,
  Proof,
} from "../../zk/zkLib";
import { Results } from "../VoteResults";
import { Voter } from "../VotingCard";
interface ProposalProps {
  message: string;
  proposalId: BigNumber;
}
export const Proposal = (props: ProposalProps) => {
  const { groupId } = useParams();
  const provider = useProvider();
  const zkVoteContract: ZKVote = useContract({
    addressOrName: "0x40D06FB96d75f361A325db5fb90568eDAd82fC3C",
    contractInterface: ZKVote__factory.abi,
    signerOrProvider: provider,
  });
  const signer = useSigner();
  const [messagesBroadcasted]: any[] = useEventListener(
    zkVoteContract,
    "CastVote",
    0
  );
  const [registrations]: any[] = useEventListener(
    zkVoteContract,
    "Register",
    0
  );
  const allIdentityCommitments: StrBigInt[] = registrations.map(
    (register: any) => register.args[3]
  );
  const votes = messagesBroadcasted
    .filter((vote: any) => BigNumber.from(vote.args[3]).eq(props.proposalId))
    .map((message: any) => ethers.utils.parseBytes32String(message.args[2]));

  const createVoteProof = async (vote: string): Promise<Proof> => {
    const clubId = await zkVoteContract!.clubs(groupId!);
    const messageBytes = ethers.utils.formatBytes32String(vote);
    const externalNullifier = createExternalNullifier(
      clubId,
      BigNumber.from(1),
      props.proposalId
    );
    const message = await signer!.data!.signMessage(
      "Sign this message to create your identity!"
    );
    const identity = new ZkIdentity(Strategy.MESSAGE, message);
    const { nullifierHash, solidityProof, root } =
      await getNullHashAndProofForMessage(
        vote,
        externalNullifier,
        identity.genIdentityCommitment(),
        allIdentityCommitments,
        identity
      );
    return {
      messageBytes,
      token: groupId!,
      nullifierHash,
      root,
      externalNullifier,
      clubId,
      messageType: BigNumber.from(1),
      flexField: props.proposalId,
      proof: solidityProof,
    };
  };
  const broadcastProof = async (proof: Proof) => {
    await broadcastMessage(zkVoteContract!.connect(signer.data!), proof);
  };
  return (
    <div style={{ paddingTop: "10px" }}>
      <Card>
        <Card.Header>
          <Card.Title>Proposal id: {props.proposalId.toString()}</Card.Title>
        </Card.Header>
        <Card.Body>
          <ReactMarkdown
            components={{
              code({ node, inline, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                return !inline && match ? (
                  <SyntaxHighlighter
                    children={String(children).replace(/\n$/, "")}
                    //@ts-ignore
                    style={gruvboxDark}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  />
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {props.message}
          </ReactMarkdown>
        </Card.Body>

        <Card.Footer>
          <Voter
            createVoteProof={createVoteProof}
            submitVoteProof={broadcastProof}
            groupId={groupId}
          />
          <hr />
          <Card.Title>Results:</Card.Title>
          <Results
            votesYes={votes.filter((vote: string) => vote === "YES").length}
            votesNo={votes.filter((vote: string) => vote === "NO").length}
            votesAbstain={
              votes.filter((vote: string) => vote === "ABSTAIN").length
            }
          />
        </Card.Footer>
      </Card>
    </div>
  );
};
