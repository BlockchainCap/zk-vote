import { Event } from "ethers";
import { useState } from "react";
import { Card, ButtonGroup, Button, Spinner, Alert } from "react-bootstrap";
import { useAccount, useContract, useProvider, useSigner } from "wagmi";
import { ZKVote, ZKVote__factory } from "../../generated";
import { useEventListener } from "../../hooks/useEventListener";
import { Proof } from "../../zk/zkLib";

interface VoterProps {
  createVoteProof: any;
  submitVoteProof: any;
  groupId: string | undefined;
}
export const Voter = (props: VoterProps) => {
  const [proof, setProof] = useState<Proof>();
  const provider = useProvider();
  const account = useAccount();
  const [generating, setGenerating] = useState<boolean>(false);
  const [err, setErr] = useState("");

  const zkVoteContract: ZKVote = useContract({
    addressOrName: "0x40D06FB96d75f361A325db5fb90568eDAd82fC3C",
    contractInterface: ZKVote__factory.abi,
    signerOrProvider: provider,
  });

  const [members]: any[] = useEventListener(zkVoteContract, "Register", 0);

  const isMember: boolean =
    members!.filter(
      (member: Event) => member!.args![2] === account.data?.address
    ).length > 0;

  const signer = useSigner();
  const handleGenerate = async (vote: string) => {
    setGenerating(true);
    setProof(undefined);
    try {
      setProof(await props.createVoteProof(vote));
    } catch (e: any) {
      console.error(e);
      setErr(e.message.toString());
    }
    setGenerating(false);
  };

  const handleSubmit = async () => {
    try {
      await props.submitVoteProof(proof);
    } catch (err: any) {
      setErr(err.message);
    }
    setProof(undefined);
  };
  return (
    <>
      <Card.Title>Cast Vote:</Card.Title>

      {signer.data && isMember ? (
        <ButtonGroup className="d-flex">
          <Button onClick={() => handleGenerate("YES")} variant="success">
            Yes
          </Button>
          <Button onClick={() => handleGenerate("NO")} variant="danger">
            No
          </Button>
          <Button onClick={() => handleGenerate("ABSTAIN")} variant="secondary">
            Abstain
          </Button>
        </ButtonGroup>
      ) : (
        "Must be registered to cast a vote"
      )}
      {proof ? (
        <>
          <Card style={{ wordBreak: "break-all" }}>
            <Card.Body>{proof.proof.toString()} </Card.Body>
          </Card>
          <Button onClick={handleSubmit}>Submit Proof</Button>
        </>
      ) : generating ? (
        <Spinner animation={"border"} />
      ) : err ? (
        <Alert onClose={() => setErr("")} variant="warning" dismissible>
          {"ERROR: " + err}
        </Alert>
      ) : (
        ""
      )}
    </>
  );
};
