import { useState } from "react";
import { Button, Modal, Form, Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { Proof } from "../../zk/zkLib";

interface CreateProposalModalProps {
  createProposal: any;
  submitProof: any;
  isMember: boolean;
  hasMinted: boolean;
  register: any;
  mint: any;
  isConnected: boolean;
  isExampleNFT: boolean;
}
export const CreateProposalModal = (props: CreateProposalModalProps) => {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState("");
  const [proof, setProof] = useState<Proof>();
  const [isGenerating, setGenerating] = useState<boolean>(false);

  const handleClose = () => setShow(false);
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      setProof(await props.createProposal(message));
    } catch (e: any) {
      console.error(e);
      setErr(e.message.toString());
    }
    setGenerating(false);
  };
  const handleSubmit = async () => {
    setShow(false);
    await props.submitProof(proof);
    setMessage("");
    setProof(undefined);
  };
  const handleShow = () => setShow(true);
  return (
    <>
      {props.isConnected ? (
        props.isMember ? (
          <Button variant="success" onClick={handleShow}>
            Create Proposal Proof
          </Button>
        ) : props.hasMinted ? (
          <Button onClick={props.register}>Register Identity</Button>
        ) : props.isExampleNFT ? (
          <Button onClick={props.mint}>Mint a sample NFT</Button>
        ) : (
          "Need to be and owner of this NFT"
        )
      ) : (
        "Need to connect to wallet to interact"
      )}
      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Create an anonymous proposal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
              <Form.Label>Proposal message (32 bytes max)</Form.Label>
              <Form.Control
                type="message"
                placeholder="..."
                autoFocus
                as="textarea"
                value={message}
                onChange={(val: any) => setMessage(val.target.value)}
              />
            </Form.Group>
          </Form>
          {proof ? (
            <Container style={{ wordBreak: "break-all" }}>
              <Modal.Dialog>
                <Row>
                  <Col>{proof.proof.toString()}</Col>
                </Row>
              </Modal.Dialog>
              <Card>
                <Card.Body>
                  <Card.Text>
                    Note that this proof can be submitted by any account. If it
                    is submitted by the same account that created it, this does
                    lose anonymity.
                  </Card.Text>
                </Card.Body>
              </Card>
              <Button onClick={handleSubmit} style={{ float: "right" }}>
                Submit Proof
              </Button>
            </Container>
          ) : isGenerating ? (
            <Spinner animation={"border"} />
          ) : err ? (
            "ERROR: " + err
          ) : (
            ""
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGenerate}>
            Create Proposal Proof
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
