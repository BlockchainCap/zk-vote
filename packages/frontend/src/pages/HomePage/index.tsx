import { Event } from "ethers";
import {
  Badge,
  Card,
  Col,
  Container,
  ListGroup,
  ListGroupItem,
  Row,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useContract, useProvider, useSigner } from "wagmi";
import { RegisterModal } from "../../components/RegisterGroupModal";
import { ERC721__factory, ZKVote__factory } from "../../generated";
import { useEventListener } from "../../hooks/useEventListener";
import { useReadNFTData } from "../../hooks/useReadNFTData";

export const HomePage = () => {
  const provider = useProvider();
  const signer = useSigner();
  const contract = useContract({
    addressOrName: "0x40D06FB96d75f361A325db5fb90568eDAd82fC3C",
    contractInterface: ZKVote__factory.abi,
    signerOrProvider: provider,
  });
  const [clubs]: any[] = useEventListener(contract, "CreateClub", 0)!;

  const createClub = async (token: string) => {
    if (signer.data) {
      await contract.connect(signer.data!).createClub(token);
    } else {
      alert("Must be logged in");
    }
  };
  return (
    <Container>
      <br />
      <Card>
        <Card.Header>
          <Row>
            <Col>
              <Card.Title>Private NFT Groups</Card.Title>
            </Col>
            <Col>
              <RegisterModal createGroup={createClub} signedIn={!!signer} />
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          <ListGroup>
            {clubs!.map((creationTx: Event, i: number) => {
              return <GroupCard key={i} groupId={creationTx!.args![0]} />;
            })}
          </ListGroup>
        </Card.Body>
      </Card>
    </Container>
  );
};

interface GroupCardProps {
  groupId: string;
}

const GroupCard = (props: GroupCardProps) => {
  const navigate = useNavigate();
  const provider = useProvider();
  const contract = useContract({
    addressOrName: props.groupId,
    contractInterface: ERC721__factory.abi,
    signerOrProvider: provider,
  });
  const { name, symbol } = useReadNFTData(contract);
  return (
    <ListGroupItem action onClick={() => navigate("/group/" + props.groupId)}>
      {name && symbol
        ? name + " - $" + symbol
        : "Group Contract Address: " + props.groupId}
      {props.groupId === "0x4215edb99e120a0A35FECe311f72DA65D5D00941" ? (
        <Badge style={{ float: "right" }}>This is the demo NFT</Badge>
      ) : (
        ""
      )}
    </ListGroupItem>
  );
};
